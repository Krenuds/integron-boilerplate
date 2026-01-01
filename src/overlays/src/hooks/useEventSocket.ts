import { useState, useEffect, useCallback, useRef } from 'react'
import type { EventType, TwitchEvent } from '@shared/event-types'

export type { EventType, TwitchEvent }

interface WebSocketMessage {
  type: 'connected' | 'event'
  clientId?: string
  event?: TwitchEvent
  timestamp: string
}

/**
 * Options for the useEventSocket hook.
 *
 * @property url - WebSocket server URL (default: ws://localhost:9847)
 * @property reconnectDelay - Delay between reconnect attempts in ms (default: 3000)
 * @property maxReconnectAttempts - Max reconnection attempts before giving up (default: 10)
 * @property onEvent - Callback fired immediately when an event is received
 * @property eventTypes - Filter to only receive specific event types (default: all)
 */
interface UseEventSocketOptions {
  url?: string
  reconnectDelay?: number
  maxReconnectAttempts?: number
  onEvent?: (event: TwitchEvent) => void
  eventTypes?: EventType[]
}

interface UseEventSocketReturn {
  connected: boolean
  events: TwitchEvent[]
  clearEvents: () => void
}

const DEFAULT_WS_URL = 'ws://localhost:9847'

/**
 * React hook for connecting to the Integron WebSocket server.
 *
 * Automatically connects on mount, handles reconnection, and accumulates events.
 *
 * @example
 * // Listen for all events
 * const { connected, events } = useEventSocket()
 *
 * @example
 * // Filter specific event types and handle immediately
 * const { connected } = useEventSocket({
 *   eventTypes: ['sub', 'bits', 'raid'],
 *   onEvent: (event) => console.log('Got event:', event)
 * })
 */
export function useEventSocket(options: UseEventSocketOptions = {}): UseEventSocketReturn {
  const {
    url = DEFAULT_WS_URL,
    reconnectDelay = 3000,
    maxReconnectAttempts = 10,
    onEvent,
    eventTypes
  } = options

  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<TwitchEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        console.log('[Overlay] WebSocket connected')
        setConnected(true)
        reconnectAttemptsRef.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          if (message.type === 'event' && message.event) {
            // Filter by event type if specified
            if (eventTypes && !eventTypes.includes(message.event.type)) {
              return
            }

            setEvents((prev) => [...prev, message.event!])
            onEvent?.(message.event)
          }
        } catch (error) {
          console.error('[Overlay] Failed to parse message:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('[Overlay] WebSocket disconnected')
        setConnected(false)

        // Attempt reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(
            `[Overlay] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current})`
          )
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('[Overlay] WebSocket error:', error)
      }
    } catch (error) {
      console.error('[Overlay] Failed to connect:', error)
    }
  }, [url, reconnectDelay, maxReconnectAttempts, onEvent, eventTypes])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return { connected, events, clearEvents }
}
