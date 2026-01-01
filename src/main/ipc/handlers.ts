import { ipcMain, BrowserWindow } from 'electron'
import { getAuthStatus, startOAuthFlow, logout, initializeAuth } from '../auth'
import { getCredentials, setCredentials } from '../store'
import { getDatabase } from '../db'
import { users, events } from '../db/schema'
import { eq, desc, inArray, sql, asc } from 'drizzle-orm'
import { getTwitchStatus } from '../twitch'
import { handleTwitchEvent, createTestEvent } from '../events/handlers'
import { eventQueue } from '../events/queue'
import { overlayServer } from '../server'
import type {
  AuthStatus,
  Credentials,
  UserListParams,
  UserListResult,
  EventListParams,
  EventListResult,
  ServerStatus,
  Settings,
  User
} from '../../shared/ipc-types'
import type { TwitchEvent, EventType } from '../../shared/event-types'

// Placeholder for settings - will be stored in DB
let appSettings: Settings = {
  serverPort: 9847,
  logLevel: 'debug'
}

export function registerIpcHandlers(): void {
  // Auth handlers
  ipcMain.handle('auth:get-status', (): AuthStatus => {
    return getAuthStatus()
  })

  ipcMain.handle('auth:start-login', async (): Promise<void> => {
    await startOAuthFlow()
  })

  ipcMain.handle('auth:logout', async (): Promise<void> => {
    await logout()
    notifyAuthChange()
  })

  ipcMain.handle('auth:save-credentials', (_event, creds: Credentials): void => {
    setCredentials(creds)
  })

  ipcMain.handle('auth:get-credentials', (): Credentials | null => {
    return getCredentials()
  })

  // Event handlers
  ipcMain.handle('events:get-recent', (_event, params: EventListParams): EventListResult => {
    const db = getDatabase()
    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const offset = (page - 1) * limit

    let query = db.select().from(events)

    if (params.types && params.types.length > 0) {
      query = query.where(inArray(events.type, params.types)) as typeof query
    }

    const results = query.orderBy(desc(events.createdAt)).limit(limit).offset(offset).all()

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .get()

    const total = countResult?.count ?? 0

    // Map to TwitchEvent format
    const mappedEvents: TwitchEvent[] = results.map((row) => ({
      id: row.id,
      type: row.type as EventType,
      userId: row.userId ?? '',
      data: (row.data ?? {}) as TwitchEvent['data'],
      createdAt: row.createdAt.toISOString(),
      username: '', // Would need to join with users table
      displayName: ''
    }))

    return {
      events: mappedEvents,
      total,
      page,
      limit
    }
  })

  ipcMain.handle(
    'events:test-fire',
    async (_event, params: { type: EventType; data?: unknown }): Promise<void> => {
      // Create and process a test event through the full pipeline
      const testEvent = createTestEvent(params.type, params.data)
      await handleTwitchEvent(testEvent)
    }
  )

  // Get Twitch connection status
  ipcMain.handle('twitch:get-status', () => {
    return getTwitchStatus()
  })

  // Get recent events from memory queue
  ipcMain.handle('events:get-queue', (_event, count: number = 50): TwitchEvent[] => {
    return eventQueue.getRecent(count)
  })

  // User handlers
  ipcMain.handle('users:get-all', (_event, params: UserListParams): UserListResult => {
    const db = getDatabase()
    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const offset = (page - 1) * limit
    const sortBy = params.sortBy ?? 'lastSeen'
    const sortDir = params.sortDir ?? 'desc'

    const sortColumn = {
      lastSeen: users.lastSeen,
      messageCount: users.messageCount,
      bitsTotal: users.bitsTotal,
      subMonths: users.subMonths
    }[sortBy]

    const orderFn = sortDir === 'desc' ? desc : asc

    const results = db
      .select()
      .from(users)
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset)
      .all()

    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .get()

    const total = countResult?.count ?? 0

    const mappedUsers: User[] = results.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.displayName ?? row.username,
      profileImageUrl: row.profileImageUrl,
      firstSeen: row.firstSeen.toISOString(),
      lastSeen: row.lastSeen.toISOString(),
      messageCount: row.messageCount,
      bitsTotal: row.bitsTotal,
      subMonths: row.subMonths,
      metadata: (row.metadata ?? {}) as Record<string, unknown>
    }))

    return {
      users: mappedUsers,
      total,
      page,
      limit
    }
  })

  ipcMain.handle('users:get-by-id', (_event, id: string): User | null => {
    const db = getDatabase()
    const result = db.select().from(users).where(eq(users.id, id)).get()

    if (!result) return null

    return {
      id: result.id,
      username: result.username,
      displayName: result.displayName ?? result.username,
      profileImageUrl: result.profileImageUrl,
      firstSeen: result.firstSeen.toISOString(),
      lastSeen: result.lastSeen.toISOString(),
      messageCount: result.messageCount,
      bitsTotal: result.bitsTotal,
      subMonths: result.subMonths,
      metadata: (result.metadata ?? {}) as Record<string, unknown>
    }
  })

  ipcMain.handle('users:delete', (_event, id: string): void => {
    const db = getDatabase()
    db.delete(users).where(eq(users.id, id)).run()
  })

  // Server handlers
  ipcMain.handle('server:get-status', (): ServerStatus => {
    return overlayServer.getStatus()
  })

  ipcMain.handle('server:restart', async (): Promise<void> => {
    await overlayServer.restart(appSettings.serverPort)
  })

  // Settings handlers
  ipcMain.handle('settings:get', (): Settings => {
    return appSettings
  })

  ipcMain.handle('settings:update', (_event, settings: Partial<Settings>): void => {
    appSettings = { ...appSettings, ...settings }
    // Will persist to DB when settings storage is implemented
  })
}

// Helper to notify auth state changes
function notifyAuthChange(): void {
  const status = getAuthStatus()
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send('auth:changed', status)
  }
}

// Initialize IPC handlers, auth, and server on startup
export async function initializeIpc(): Promise<void> {
  registerIpcHandlers()
  await initializeAuth()

  // Start overlay server
  try {
    await overlayServer.start(appSettings.serverPort)
  } catch (error) {
    console.error('[IPC] Failed to start overlay server:', error)
  }
}
