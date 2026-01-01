import { BrowserWindow } from 'electron'
import { getDatabase } from '../db'
import { users, events } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { eventBus } from './bus'
import { eventQueue } from './queue'
import { getApiClient } from '../auth/twurple'
import type { TwitchEvent, EventType } from '../../shared/event-types'

// Process incoming Twitch events:
// 1. Update/create user in database
// 2. Store event in database (if persistent type)
// 3. Add to in-memory queue
// 4. Emit to event bus (which broadcasts to UI and WebSocket)

const PERSISTENT_EVENTS: EventType[] = [
  'sub',
  'resub',
  'gift_sub',
  'bits',
  'follow',
  'raid',
  'redemption',
  'hype_train_begin',
  'hype_train_end'
]

export async function handleTwitchEvent(event: TwitchEvent): Promise<void> {
  console.log(`[Handler] Processing ${event.type} event from ${event.displayName}`)

  const db = getDatabase()

  // Update or create user, get profile image
  const profileImageUrl = await upsertUser(event.userId, event.username, event.displayName)

  // Add profile image to event
  if (profileImageUrl) {
    event.profileImageUrl = profileImageUrl
  }

  // Update user stats based on event type
  await updateUserStats(event)

  // Store event if it's a persistent type
  if (PERSISTENT_EVENTS.includes(event.type)) {
    db.insert(events)
      .values({
        type: event.type,
        userId: event.userId,
        data: event.data,
        createdAt: new Date(event.createdAt)
      })
      .run()
  }

  // Add to in-memory queue
  eventQueue.push(event)
  console.log(`[Handler] Queue size: ${eventQueue.getRecent(1000).length}`)

  // Emit to event bus
  eventBus.emitEvent(event)

  // Broadcast to renderer windows
  broadcastToRenderer(event)
}

async function upsertUser(
  userId: string,
  username: string,
  displayName: string
): Promise<string | undefined> {
  const db = getDatabase()
  const now = new Date()

  const existing = db.select().from(users).where(eq(users.id, userId)).get()

  if (existing) {
    db.update(users)
      .set({
        username,
        displayName,
        lastSeen: now
      })
      .where(eq(users.id, userId))
      .run()

    // Return cached profile image if available
    if (existing.profileImageUrl) {
      return existing.profileImageUrl
    }
  } else {
    db.insert(users)
      .values({
        id: userId,
        username,
        displayName,
        firstSeen: now,
        lastSeen: now,
        messageCount: 0,
        bitsTotal: 0,
        subMonths: 0
      })
      .run()
  }

  // Fetch profile image from Twitch API if not cached
  const apiClient = getApiClient()
  if (apiClient) {
    try {
      const user = await apiClient.users.getUserById(userId)
      if (user?.profilePictureUrl) {
        db.update(users)
          .set({ profileImageUrl: user.profilePictureUrl })
          .where(eq(users.id, userId))
          .run()
        return user.profilePictureUrl
      }
    } catch (err) {
      console.error('[Handler] Failed to fetch profile image:', err)
    }
  }

  return undefined
}

async function updateUserStats(event: TwitchEvent): Promise<void> {
  const db = getDatabase()

  switch (event.type) {
    case 'chat':
      db.update(users)
        .set({
          messageCount: sql`${users.messageCount} + 1`
        })
        .where(eq(users.id, event.userId))
        .run()
      break

    case 'bits':
      if ('amount' in event.data) {
        db.update(users)
          .set({
            bitsTotal: sql`${users.bitsTotal} + ${event.data.amount}`
          })
          .where(eq(users.id, event.userId))
          .run()
      }
      break

    case 'sub':
    case 'resub':
      db.update(users)
        .set({
          subMonths: sql`${users.subMonths} + 1`
        })
        .where(eq(users.id, event.userId))
        .run()
      break

    case 'gift_sub':
      if ('amount' in event.data) {
        db.update(users)
          .set({
            subMonths: sql`${users.subMonths} + ${event.data.amount}`
          })
          .where(eq(users.id, event.userId))
          .run()
      }
      break
  }
}

function broadcastToRenderer(event: TwitchEvent): void {
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send('event:new', event)
  }
}

// Create a test event for development
export function createTestEvent(type: EventType, data?: unknown): TwitchEvent {
  return {
    id: Date.now(),
    type,
    userId: 'test-user-123',
    data: (data ?? getDefaultEventData(type)) as TwitchEvent['data'],
    createdAt: new Date().toISOString(),
    username: 'test_user',
    displayName: 'Test User'
  }
}

function getDefaultEventData(type: EventType): unknown {
  switch (type) {
    case 'chat':
      return { message: 'Test message!', badges: [], color: '#FF0000', emotes: [] }
    case 'sub':
      return { tier: '1000', message: null, isGift: false }
    case 'resub':
      return { tier: '1000', months: 12, streak: 6, message: 'Thanks for the stream!' }
    case 'gift_sub':
      return { tier: '1000', amount: 5, total: 50 }
    case 'bits':
      return { amount: 100, message: 'Cheer100 Great stream!' }
    case 'follow':
      return { followedAt: new Date().toISOString() }
    case 'raid':
      return { viewers: 50 }
    case 'redemption':
      return { rewardId: 'test-reward', rewardTitle: 'Test Reward', rewardCost: 100, userInput: null }
    case 'hype_train_begin':
      return { level: 1, total: 500, goal: 1000 }
    case 'hype_train_end':
      return { level: 3, total: 5000 }
    case 'poll_begin':
    case 'poll_end':
      return { pollId: 'test-poll', title: 'Test Poll', choices: [] }
    case 'prediction_begin':
    case 'prediction_end':
      return { predictionId: 'test-pred', title: 'Test Prediction', outcomes: [] }
    case 'shoutout':
      return { targetUserId: 'target-123', targetUsername: 'target_user', viewerCount: 100 }
    default:
      return {}
  }
}
