import { createRoot } from 'react-dom/client'
import { useEffect, useRef, useMemo } from 'react'
import { useEventSocket, TwitchEvent, EventType } from './hooks/useEventSocket'
import type {
  ChatEventData,
  SubEventData,
  ResubEventData,
  GiftSubEventData,
  BitsEventData,
  RaidEventData,
  RedemptionEventData,
  HypeTrainBeginEventData,
  HypeTrainEndEventData,
  PollEventData,
  PredictionEventData,
  ShoutoutEventData
} from '@shared/event-types'

// Parse URL params
function getUrlParams(): { max: number; types: EventType[] | undefined } {
  const params = new URLSearchParams(window.location.search)
  const max = parseInt(params.get('max') || '50', 10)
  const typesParam = params.get('types')
  const types = typesParam ? (typesParam.split(',') as EventType[]) : undefined
  return { max, types }
}

// Event type icons/colors
const eventStyles: Record<EventType, { icon: string; color: string }> = {
  chat: { icon: '💬', color: '#9CA3AF' },
  sub: { icon: '⭐', color: '#A855F7' },
  resub: { icon: '🌟', color: '#A855F7' },
  gift_sub: { icon: '🎁', color: '#EC4899' },
  bits: { icon: '💎', color: '#F59E0B' },
  follow: { icon: '❤️', color: '#EF4444' },
  raid: { icon: '🚀', color: '#3B82F6' },
  redemption: { icon: '🎯', color: '#10B981' },
  hype_train_begin: { icon: '🚂', color: '#F97316' },
  hype_train_end: { icon: '🏁', color: '#F97316' },
  poll_begin: { icon: '📊', color: '#6366F1' },
  poll_end: { icon: '📊', color: '#6366F1' },
  prediction_begin: { icon: '🔮', color: '#8B5CF6' },
  prediction_end: { icon: '🔮', color: '#8B5CF6' },
  shoutout: { icon: '📢', color: '#14B8A6' }
}

function getEventDescription(event: TwitchEvent): string {
  switch (event.type) {
    case 'chat': {
      const data = event.data as ChatEventData
      return data.message
    }
    case 'sub': {
      const data = event.data as SubEventData
      return `New subscriber (Tier ${data.tier.charAt(0)})`
    }
    case 'resub': {
      const data = event.data as ResubEventData
      return `Resubscribed for ${data.months} months`
    }
    case 'gift_sub': {
      const data = event.data as GiftSubEventData
      return `Gifted ${data.amount} sub${data.amount > 1 ? 's' : ''}`
    }
    case 'bits': {
      const data = event.data as BitsEventData
      return `Cheered ${data.amount} bits`
    }
    case 'follow':
      return 'New follower'
    case 'raid': {
      const data = event.data as RaidEventData
      return `Raided with ${data.viewers} viewers`
    }
    case 'redemption': {
      const data = event.data as RedemptionEventData
      return `Redeemed: ${data.rewardTitle}`
    }
    case 'hype_train_begin': {
      const data = event.data as HypeTrainBeginEventData
      return `Hype Train started! Level ${data.level}`
    }
    case 'hype_train_end': {
      const data = event.data as HypeTrainEndEventData
      return `Hype Train ended at level ${data.level}`
    }
    case 'poll_begin':
    case 'poll_end': {
      const data = event.data as PollEventData
      return `Poll ${event.type === 'poll_begin' ? 'started' : 'ended'}: ${data.title}`
    }
    case 'prediction_begin':
    case 'prediction_end': {
      const data = event.data as PredictionEventData
      return `Prediction ${event.type === 'prediction_begin' ? 'started' : 'ended'}: ${data.title}`
    }
    case 'shoutout': {
      const data = event.data as ShoutoutEventData
      return `Shoutout to ${data.targetUsername}`
    }
    default:
      return event.type
  }
}

function EventItem({ event }: { event: TwitchEvent }) {
  const style = eventStyles[event.type] || { icon: '📌', color: '#6B7280' }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '6px',
        marginBottom: '4px',
        borderLeft: `3px solid ${style.color}`
      }}
    >
      <span style={{ fontSize: '16px' }}>{style.icon}</span>
      <img
        src={event.profileImageUrl || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/75305d54-c7cc-40d1-bb9c-91c7eb50f43e-profile_image-70x70.png'}
        alt=""
        style={{ width: '24px', height: '24px', borderRadius: '50%' }}
      />
      <span style={{ color: style.color, fontWeight: 600, fontSize: '14px' }}>
        {event.displayName}
      </span>
      <span style={{ color: '#D1D5DB', fontSize: '13px', flex: 1 }}>
        {getEventDescription(event)}
      </span>
    </div>
  )
}

function Feed() {
  const { max, types } = useMemo(() => getUrlParams(), [])
  const { events, connected } = useEventSocket({ eventTypes: types })
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep only the most recent events
  const displayEvents = useMemo(() => events.slice(-max), [events, max])

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayEvents])

  return (
    <div
      ref={containerRef}
      style={{
        height: '100vh',
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {!connected && (
        <div
          style={{
            padding: '8px',
            background: 'rgba(239, 68, 68, 0.8)',
            borderRadius: '6px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '8px'
          }}
        >
          Connecting...
        </div>
      )}
      {displayEvents.map((event) => (
        <EventItem key={event.id} event={event} />
      ))}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Feed />)
