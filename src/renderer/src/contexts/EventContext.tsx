import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { TwitchEvent, EventType } from '../../../shared/event-types'
import type { TwitchStatus } from '../../../shared/ipc-types'

interface EventContextValue {
  events: TwitchEvent[]
  twitchStatus: TwitchStatus
  isLoading: boolean
  refreshEvents: () => Promise<void>
  refreshStatus: () => Promise<void>
  fireTestEvent: (type: EventType, data?: unknown) => Promise<void>
}

const EventContext = createContext<EventContextValue | null>(null)

const MAX_EVENTS = 100

export function EventProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [events, setEvents] = useState<TwitchEvent[]>([])
  const [twitchStatus, setTwitchStatus] = useState<TwitchStatus>({
    authenticated: false,
    chat: false,
    eventsub: false,
    channel: null
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshEvents = useCallback(async () => {
    try {
      const queue = await window.api.getEventQueue(MAX_EVENTS)
      setEvents(queue)
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }, [])

  const refreshStatus = useCallback(async () => {
    try {
      const status = await window.api.getTwitchStatus()
      setTwitchStatus(status)
    } catch (err) {
      console.error('Failed to fetch Twitch status:', err)
    }
  }, [])

  const fireTestEvent = useCallback(async (type: EventType, data?: unknown) => {
    try {
      await window.api.testFireEvent({ type, data })
    } catch (err) {
      console.error('Failed to fire test event:', err)
      throw err
    }
  }, [])

  // Initial load
  useEffect(() => {
    Promise.all([refreshEvents(), refreshStatus()]).finally(() => setIsLoading(false))
  }, [refreshEvents, refreshStatus])

  // Listen for new events from main process
  useEffect(() => {
    const unsubscribe = window.api.onEvent((event) => {
      setEvents((prev) => {
        const newEvents = [event as TwitchEvent, ...prev]
        // Keep only the most recent events
        return newEvents.slice(0, MAX_EVENTS)
      })
    })
    return () => {
      unsubscribe()
    }
  }, [])

  // Poll Twitch status periodically (connection state can change)
  useEffect(() => {
    const interval = setInterval(refreshStatus, 5000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  return (
    <EventContext.Provider
      value={{
        events,
        twitchStatus,
        isLoading,
        refreshEvents,
        refreshStatus,
        fireTestEvent
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

export function useEvents(): EventContextValue {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEvents must be used within EventProvider')
  }
  return context
}
