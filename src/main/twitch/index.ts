import { ApiClient } from '@twurple/api'
import { getAuthProvider, createAuthProvider } from '../auth/twurple'
import { getBroadcaster } from '../store'
import { connectChat, disconnectChat, isChatConnected } from './chat'
import { connectEventSub, disconnectEventSub, isEventSubConnected } from './eventsub'
import { eventBus } from '../events/bus'

let apiClient: ApiClient | null = null

export interface TwitchConnectionStatus {
  authenticated: boolean
  chat: boolean
  eventsub: boolean
  channel: string | null
}

export function getApiClient(): ApiClient | null {
  return apiClient
}

export async function initializeTwitch(): Promise<boolean> {
  const authProvider = getAuthProvider() ?? createAuthProvider()

  if (!authProvider) {
    console.log('No auth provider available - not authenticated')
    return false
  }

  const broadcaster = getBroadcaster()
  if (!broadcaster) {
    console.log('No broadcaster info stored')
    return false
  }

  try {
    apiClient = new ApiClient({ authProvider })

    // Connect to chat and EventSub
    await connectChat(authProvider, broadcaster.login)
    await connectEventSub(authProvider, broadcaster.id)

    console.log(`Twitch initialized for channel: ${broadcaster.login}`)
    return true
  } catch (error) {
    console.error('Failed to initialize Twitch:', error)
    apiClient = null
    return false
  }
}

export async function disconnectTwitch(): Promise<void> {
  disconnectChat()
  disconnectEventSub()
  apiClient = null
  console.log('Twitch disconnected')
}

export function getTwitchStatus(): TwitchConnectionStatus {
  const broadcaster = getBroadcaster()

  return {
    authenticated: !!getAuthProvider(),
    chat: isChatConnected(),
    eventsub: isEventSubConnected(),
    channel: broadcaster?.login ?? null
  }
}

// Re-export event bus for external access
export { eventBus }
