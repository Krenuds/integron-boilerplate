// Event types for Twitch events

export type EventType =
  | 'chat'
  | 'sub'
  | 'resub'
  | 'gift_sub'
  | 'bits'
  | 'follow'
  | 'raid'
  | 'redemption'
  | 'hype_train_begin'
  | 'hype_train_end'
  | 'poll_begin'
  | 'poll_end'
  | 'prediction_begin'
  | 'prediction_end'
  | 'shoutout'

export interface BaseEvent {
  id: number
  type: EventType
  userId: string
  createdAt: string
}

export interface ChatEventData {
  message: string
  badges: string[]
  color: string | null
  emotes: { id: string; positions: string }[]
}

export interface SubEventData {
  tier: '1000' | '2000' | '3000'
  message: string | null
  isGift: boolean
  gifterUserId?: string
  gifterUsername?: string
}

export interface ResubEventData {
  tier: '1000' | '2000' | '3000'
  months: number
  streak: number | null
  message: string | null
}

export interface GiftSubEventData {
  tier: '1000' | '2000' | '3000'
  amount: number
  total: number
  recipientUserId?: string
  recipientUsername?: string
}

export interface BitsEventData {
  amount: number
  message: string | null
}

export interface FollowEventData {
  followedAt: string
}

export interface RaidEventData {
  viewers: number
}

export interface RedemptionEventData {
  rewardId: string
  rewardTitle: string
  rewardCost: number
  userInput: string | null
}

export interface HypeTrainBeginEventData {
  level: number
  total: number
  goal: number
}

export interface HypeTrainEndEventData {
  level: number
  total: number
}

export interface PollEventData {
  pollId: string
  title: string
  choices: { id: string; title: string; votes: number }[]
}

export interface PredictionEventData {
  predictionId: string
  title: string
  outcomes: { id: string; title: string; users: number; points: number }[]
  winningOutcomeId?: string
}

export interface ShoutoutEventData {
  targetUserId: string
  targetUsername: string
  viewerCount: number
}

export type EventData =
  | ChatEventData
  | SubEventData
  | ResubEventData
  | GiftSubEventData
  | BitsEventData
  | FollowEventData
  | RaidEventData
  | RedemptionEventData
  | HypeTrainBeginEventData
  | HypeTrainEndEventData
  | PollEventData
  | PredictionEventData
  | ShoutoutEventData

export interface TwitchEvent extends BaseEvent {
  data: EventData
  username: string
  displayName: string
  profileImageUrl?: string
}
