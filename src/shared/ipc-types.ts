// IPC channel definitions and types

import type { TwitchEvent, EventType } from './event-types'

// Auth
export interface AuthStatus {
  authenticated: boolean
  broadcasterLogin: string | null
  broadcasterId: string | null
}

export interface Credentials {
  clientId: string
  clientSecret: string
}

// Users
export interface User {
  id: string
  username: string
  displayName: string
  profileImageUrl: string | null
  firstSeen: string
  lastSeen: string
  messageCount: number
  bitsTotal: number
  subMonths: number
  metadata: Record<string, unknown>
}

export interface UserListParams {
  page?: number
  limit?: number
  sortBy?: 'lastSeen' | 'messageCount' | 'bitsTotal' | 'subMonths'
  sortDir?: 'asc' | 'desc'
}

export interface UserListResult {
  users: User[]
  total: number
  page: number
  limit: number
}

// Events
export interface EventListParams {
  page?: number
  limit?: number
  types?: EventType[]
}

export interface EventListResult {
  events: TwitchEvent[]
  total: number
  page: number
  limit: number
}

// Server
export interface ServerStatus {
  running: boolean
  port: number
  connections: number
}

// Settings
export interface Settings {
  serverPort: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

// IPC Channel map
export interface IpcChannels {
  // Auth
  'auth:get-status': { params: void; result: AuthStatus }
  'auth:start-login': { params: void; result: void }
  'auth:logout': { params: void; result: void }
  'auth:save-credentials': { params: Credentials; result: void }
  'auth:get-credentials': { params: void; result: Credentials | null }

  // Events
  'events:get-recent': { params: EventListParams; result: EventListResult }
  'events:test-fire': { params: { type: EventType; data?: unknown }; result: void }

  // Users
  'users:get-all': { params: UserListParams; result: UserListResult }
  'users:get-by-id': { params: string; result: User | null }
  'users:delete': { params: string; result: void }

  // Server
  'server:get-status': { params: void; result: ServerStatus }
  'server:restart': { params: void; result: void }

  // Settings
  'settings:get': { params: void; result: Settings }
  'settings:update': { params: Partial<Settings>; result: void }
}

// Helper types for typed IPC
export type IpcChannel = keyof IpcChannels
export type IpcParams<C extends IpcChannel> = IpcChannels[C]['params']
export type IpcResult<C extends IpcChannel> = IpcChannels[C]['result']
