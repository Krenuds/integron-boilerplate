import { ChatClient } from '@twurple/chat'
import type { RefreshingAuthProvider } from '@twurple/auth'
import { eventBus } from '../events/bus'
import { handleTwitchEvent } from '../events/handlers'
import type { TwitchEvent, ChatEventData } from '../../shared/event-types'

let chatClient: ChatClient | null = null
let currentChannel: string | null = null

export async function connectChat(
  authProvider: RefreshingAuthProvider,
  channel: string
): Promise<void> {
  if (chatClient) {
    await disconnectChat()
  }

  chatClient = new ChatClient({
    authProvider,
    channels: [channel]
  })

  // Connection events
  chatClient.onConnect(() => {
    console.log(`Chat connected to #${channel}`)
    eventBus.emitConnected('chat', channel)
  })

  chatClient.onDisconnect((_manually, reason) => {
    console.log(`Chat disconnected: ${reason ?? 'unknown reason'}`)
    eventBus.emitDisconnected('chat', reason?.message)
  })

  // Chat messages
  chatClient.onMessage((_channel, _user, message, msg) => {
    console.log(`[Chat] Message from ${msg.userInfo.displayName}: ${message.slice(0, 50)}`)

    const eventData: ChatEventData = {
      message,
      badges: Array.from(msg.userInfo.badges.keys()),
      color: msg.userInfo.color ?? null,
      emotes: msg.emoteOffsets
        ? Array.from(msg.emoteOffsets.entries()).map(([id, positions]) => ({
            id,
            positions: positions.join(',')
          }))
        : []
    }

    const event: TwitchEvent = {
      id: Date.now(),
      type: 'chat',
      userId: msg.userInfo.userId,
      username: msg.userInfo.userName,
      displayName: msg.userInfo.displayName,
      data: eventData,
      createdAt: new Date().toISOString()
    }

    handleTwitchEvent(event).catch((err) => {
      console.error('[Chat] Failed to handle event:', err)
    })
  })

  // Subscriptions via chat (as backup to EventSub)
  chatClient.onSub((_channel, user, subInfo, msg) => {
    const event: TwitchEvent = {
      id: Date.now(),
      type: 'sub',
      userId: msg.userInfo.userId,
      username: user,
      displayName: msg.userInfo.displayName,
      data: {
        tier: subInfo.plan as '1000' | '2000' | '3000',
        message: subInfo.message ?? null,
        isGift: false
      },
      createdAt: new Date().toISOString()
    }

    handleTwitchEvent(event)
  })

  chatClient.onResub((_channel, user, subInfo, msg) => {
    const event: TwitchEvent = {
      id: Date.now(),
      type: 'resub',
      userId: msg.userInfo.userId,
      username: user,
      displayName: msg.userInfo.displayName,
      data: {
        tier: subInfo.plan as '1000' | '2000' | '3000',
        months: subInfo.months,
        streak: subInfo.streak ?? null,
        message: subInfo.message ?? null
      },
      createdAt: new Date().toISOString()
    }

    handleTwitchEvent(event)
  })

  chatClient.onSubGift((_channel, _user, subInfo, msg) => {
    const event: TwitchEvent = {
      id: Date.now(),
      type: 'gift_sub',
      userId: msg.userInfo.userId,
      username: msg.userInfo.userName,
      displayName: msg.userInfo.displayName,
      data: {
        tier: subInfo.plan as '1000' | '2000' | '3000',
        amount: 1,
        total: subInfo.gifterGiftCount ?? 1
      },
      createdAt: new Date().toISOString()
    }

    handleTwitchEvent(event)
  })

  chatClient.onCommunitySub((_channel, user, subInfo, msg) => {
    const event: TwitchEvent = {
      id: Date.now(),
      type: 'gift_sub',
      userId: msg.userInfo.userId,
      username: user,
      displayName: msg.userInfo.displayName,
      data: {
        tier: subInfo.plan as '1000' | '2000' | '3000',
        amount: subInfo.count,
        total: subInfo.gifterGiftCount ?? subInfo.count
      },
      createdAt: new Date().toISOString()
    }

    handleTwitchEvent(event)
  })

  // Raids
  chatClient.onRaid((_channel, user, raidInfo) => {
    const event: TwitchEvent = {
      id: Date.now(),
      type: 'raid',
      userId: user,
      username: user,
      displayName: raidInfo.displayName,
      data: {
        viewers: raidInfo.viewerCount
      },
      createdAt: new Date().toISOString()
    }

    handleTwitchEvent(event)
  })

  try {
    await chatClient.connect()
    currentChannel = channel
  } catch (error) {
    console.error('Failed to connect chat:', error)
    eventBus.emitError('chat', error as Error)
    throw error
  }
}

export function disconnectChat(): void {
  if (chatClient) {
    chatClient.quit()
    chatClient = null
    currentChannel = null
  }
}

export function isChatConnected(): boolean {
  return chatClient?.isConnected ?? false
}

export function getChatChannel(): string | null {
  return currentChannel
}
