import type { TwitchEvent } from '../../shared/event-types'

// Circular buffer queue for events
// Prevents memory overflow during high-traffic periods

export class EventQueue {
  private queue: TwitchEvent[] = []
  private maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
  }

  push(event: TwitchEvent): void {
    this.queue.push(event)
    if (this.queue.length > this.maxSize) {
      this.queue.shift()
    }
  }

  getRecent(count: number): TwitchEvent[] {
    return this.queue.slice(-count)
  }

  getAll(): TwitchEvent[] {
    return [...this.queue]
  }

  clear(): void {
    this.queue = []
  }

  get size(): number {
    return this.queue.length
  }

  get capacity(): number {
    return this.maxSize
  }
}

// Singleton instance
export const eventQueue = new EventQueue(1000)
