import { useState, useEffect, useCallback, useRef } from 'react'
import type { EventType, TwitchEvent } from '@shared/event-types'

export type { EventType, TwitchEvent }

interface WebSocketMessage {
  type: 'connected' | 'event'
  clientId?: string
  event?: TwitchEvent
  timestamp: string
}

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
