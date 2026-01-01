import { createRoot } from 'react-dom/client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useEventSocket, TwitchEvent } from './hooks/useEventSocket'
import type { ChatEventData } from '@shared/event-types'

/**
 * URL Parameters:
 *   ?max=10    - Max messages to display (default: 10)
 *   ?fade=30000 - Message lifetime in ms before fade-out (default: 30000)
 */
function getUrlParams(): { max: number; fade: number } {
  const params = new URLSearchParams(window.location.search)
  const max = parseInt(params.get('max') || '10', 10)
  const fade = parseInt(params.get('fade') || '30000', 10)
  return { max, fade }
}

interface ChatMessage extends TwitchEvent {
  fadeAt: number
}

function ChatMessageItem({
  message,
  onFaded
}: {
  message: ChatMessage
  fade: number
  onFaded: (id: number) => void
}) {
  const [opacity, setOpacity] = useState(1)
  const data = message.data as ChatEventData

  useEffect(() => {
    const now = Date.now()
    const timeUntilFade = message.fadeAt - now

    if (timeUntilFade <= 0) {
      onFaded(message.id)
      return
    }

    // Start fade animation 1 second before removal
    const fadeTimer = setTimeout(() => {
      setOpacity(0)
    }, timeUntilFade - 1000)

    // Remove message
    const removeTimer = setTimeout(() => {
      onFaded(message.id)
    }, timeUntilFade)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [message.fadeAt, message.id, onFaded])

  const userColor = data.color || '#9CA3AF'
  const badges = data.badges || []

  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '6px',
        marginBottom: '4px',
        opacity,
        transition: 'opacity 1s ease-out'
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {badges.includes('broadcaster') && (
          <span
            style={{
              background: '#EF4444',
              color: 'white',
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px'
            }}
          >
            LIVE
          </span>
        )}
        {badges.includes('moderator') && (
          <span
            style={{
              background: '#22C55E',
              color: 'white',
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px'
            }}
          >
            MOD
          </span>
        )}
        {badges.includes('vip') && (
          <span
            style={{
              background: '#EC4899',
              color: 'white',
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px'
            }}
          >
            VIP
          </span>
        )}
        {badges.includes('subscriber') && (
          <span
            style={{
              background: '#A855F7',
              color: 'white',
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px'
            }}
          >
            SUB
          </span>
        )}
        <span style={{ color: userColor, fontWeight: 600, fontSize: '14px' }}>
          {message.displayName}
        </span>
        <span style={{ color: '#6B7280' }}>:</span>
      </span>
      <span style={{ color: '#E5E7EB', fontSize: '14px', marginLeft: '6px' }}>
        {data.message || ''}
      </span>
    </div>
  )
}

function Chat() {
  const { max, fade } = useMemo(() => getUrlParams(), [])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEvent = useCallback(
    (event: TwitchEvent) => {
      if (event.type === 'chat') {
        const chatMessage: ChatMessage = {
          ...event,
          fadeAt: Date.now() + fade
        }
        setMessages((prev) => {
          const updated = [...prev, chatMessage]
          // Keep only max messages
          return updated.slice(-max)
        })
      }
    },
    [fade, max]
  )

  const handleFaded = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  useEventSocket({ onEvent: handleEvent })

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} fade={fade} onFaded={handleFaded} />
      ))}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Chat />)
