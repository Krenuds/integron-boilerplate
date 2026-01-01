import { EventEmitter } from 'events'
import type { TwitchEvent } from '../../shared/event-types'

// Event bus for internal event distribution
// All Twitch events flow through here before being broadcast to UI and WebSocket

interface EventBusEvents {
  event: [TwitchEvent]
  connected: [{ type: 'chat' | 'eventsub'; channel: string }]
  disconnected: [{ type: 'chat' | 'eventsub'; reason?: string }]
  error: [{ type: 'chat' | 'eventsub'; error: Error }]
}

class EventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(20)
  }

  emitEvent(event: TwitchEvent): void {
    this.emit('event', event)
  }

  emitConnected(type: 'chat' | 'eventsub', channel: string): void {
    this.emit('connected', { type, channel })
  }

  emitDisconnected(type: 'chat' | 'eventsub', reason?: string): void {
    this.emit('disconnected', { type, reason })
  }

  emitError(type: 'chat' | 'eventsub', error: Error): void {
    this.emit('error', { type, error })
  }

  onEvent(handler: (event: TwitchEvent) => void): void {
    this.on('event', handler)
  }

  onConnected(handler: (data: EventBusEvents['connected'][0]) => void): void {
    this.on('connected', handler)
  }

  onDisconnected(handler: (data: EventBusEvents['disconnected'][0]) => void): void {
    this.on('disconnected', handler)
  }

  onError(handler: (data: EventBusEvents['error'][0]) => void): void {
    this.on('error', handler)
  }

  removeEventHandler(handler: (event: TwitchEvent) => void): void {
    this.off('event', handler)
  }
}

// Singleton instance
export const eventBus = new EventBus()
