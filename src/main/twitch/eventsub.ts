import { EventSubWsListener } from '@twurple/eventsub-ws'
import { ApiClient } from '@twurple/api'
import type { RefreshingAuthProvider } from '@twurple/auth'
import { eventBus } from '../events/bus'
import { handleTwitchEvent } from '../events/handlers'
import type { TwitchEvent } from '../../shared/event-types'

let eventSubListener: EventSubWsListener | null = null
let apiClient: ApiClient | null = null
let connected = false

export async function connectEventSub(
  authProvider: RefreshingAuthProvider,
  broadcasterId: string
): Promise<void> {
  if (eventSubListener) {
    disconnectEventSub()
  }

  apiClient = new ApiClient({ authProvider })
  eventSubListener = new EventSubWsListener({ apiClient })

  // Subscribe to events

  // Follows
  eventSubListener.onChannelFollow(broadcasterId, broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'follow',
      userId: event.userId,
      username: event.userName,
      displayName: event.userDisplayName,
      data: {
        followedAt: event.followDate.toISOString()
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  // Channel Point Redemptions
  eventSubListener.onChannelRedemptionAdd(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'redemption',
      userId: event.userId,
      username: event.userName,
      displayName: event.userDisplayName,
      data: {
        rewardId: event.rewardId,
        rewardTitle: event.rewardTitle,
        rewardCost: event.rewardCost,
        userInput: event.input ?? null
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  // Hype Train
  eventSubListener.onChannelHypeTrainBegin(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'hype_train_begin',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Hype Train',
      data: {
        level: event.level,
        total: event.total,
        goal: event.goal
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  eventSubListener.onChannelHypeTrainEnd(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'hype_train_end',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Hype Train',
      data: {
        level: event.level,
        total: event.total
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  // Polls
  eventSubListener.onChannelPollBegin(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'poll_begin',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Poll',
      data: {
        pollId: event.id,
        title: event.title,
        choices: event.choices.map((c) => ({
          id: c.id,
          title: c.title,
          votes: 0
        }))
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  eventSubListener.onChannelPollEnd(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'poll_end',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Poll',
      data: {
        pollId: event.id,
        title: event.title,
        choices: event.choices.map((c) => ({
          id: c.id,
          title: c.title,
          votes: c.totalVotes
        }))
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  // Predictions
  eventSubListener.onChannelPredictionBegin(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'prediction_begin',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Prediction',
      data: {
        predictionId: event.id,
        title: event.title,
        outcomes: event.outcomes.map((o) => ({
          id: o.id,
          title: o.title,
          users: 0,
          points: 0
        }))
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  eventSubListener.onChannelPredictionEnd(broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'prediction_end',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Prediction',
      data: {
        predictionId: event.id,
        title: event.title,
        outcomes: event.outcomes.map((o) => ({
          id: o.id,
          title: o.title,
          users: o.users ?? 0,
          points: o.channelPoints ?? 0
        })),
        winningOutcomeId: event.winningOutcome?.id
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  // Shoutouts
  eventSubListener.onChannelShoutoutCreate(broadcasterId, broadcasterId, (event) => {
    const twitchEvent: TwitchEvent = {
      id: Date.now(),
      type: 'shoutout',
      userId: broadcasterId,
      username: 'system',
      displayName: 'Shoutout',
      data: {
        targetUserId: event.shoutedOutBroadcasterId,
        targetUsername: event.shoutedOutBroadcasterName,
        viewerCount: event.viewerCount
      },
      createdAt: new Date().toISOString()
    }
    handleTwitchEvent(twitchEvent)
  })

  try {
    await eventSubListener.start()
    connected = true
    console.log('EventSub connected')
    eventBus.emitConnected('eventsub', broadcasterId)
  } catch (error) {
    console.error('Failed to connect EventSub:', error)
    eventBus.emitError('eventsub', error as Error)
    throw error
  }
}

export function disconnectEventSub(): void {
  if (eventSubListener) {
    eventSubListener.stop()
    eventSubListener = null
    apiClient = null
    connected = false
  }
}

export function isEventSubConnected(): boolean {
  return connected
}
