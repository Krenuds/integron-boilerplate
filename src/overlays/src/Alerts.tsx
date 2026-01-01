import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { useEventSocket, TwitchEvent, EventType } from './hooks/useEventSocket'
import type {
  SubEventData,
  ResubEventData,
  GiftSubEventData,
  BitsEventData,
  RaidEventData,
  RedemptionEventData,
  HypeTrainBeginEventData,
  ShoutoutEventData
} from '@shared/event-types'

/**
 * URL Parameters:
 *   ?duration=5000  - Alert display time in ms (default: 5000)
 *   ?animation=slide - Animation type: slide, fade, pop (default: slide)
 */
function getUrlParams(): { duration: number; animation: 'slide' | 'fade' | 'pop' } {
  const params = new URLSearchParams(window.location.search)
  const duration = parseInt(params.get('duration') || '5000', 10)
  const animation = (params.get('animation') || 'slide') as 'slide' | 'fade' | 'pop'
  return { duration, animation }
}

// Only show alerts for these event types (not chat)
const ALERT_TYPES: EventType[] = [
  'sub',
  'resub',
  'gift_sub',
  'bits',
  'follow',
  'raid',
  'redemption',
  'hype_train_begin',
  'shoutout'
]

// Alert styles per event type
const alertStyles: Record<string, { title: string; color: string; gradient: string }> = {
  sub: {
    title: 'New Subscriber!',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
  },
  resub: {
    title: 'Resubscribed!',
    color: '#A855F7',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
  },
  gift_sub: {
    title: 'Gift Sub!',
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
  },
  bits: {
    title: 'Bits!',
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  },
  follow: {
    title: 'New Follower!',
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
  },
  raid: {
    title: 'Raid!',
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
  },
  redemption: {
    title: 'Reward Redeemed!',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  },
  hype_train_begin: {
    title: 'Hype Train!',
    color: '#F97316',
    gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
  },
  shoutout: {
    title: 'Shoutout!',
    color: '#14B8A6',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)'
  }
}

function getAlertMessage(event: TwitchEvent): string {
  switch (event.type) {
    case 'sub': {
      const data = event.data as SubEventData
      return `Tier ${data.tier.charAt(0)} subscription`
    }
    case 'resub': {
      const data = event.data as ResubEventData
      return `${data.months} months subscribed!`
    }
    case 'gift_sub': {
      const data = event.data as GiftSubEventData
      return `Gifted ${data.amount} sub${data.amount > 1 ? 's' : ''}!`
    }
    case 'bits': {
      const data = event.data as BitsEventData
      return `${data.amount} bits cheered!`
    }
    case 'follow':
      return 'Thanks for following!'
    case 'raid': {
      const data = event.data as RaidEventData
      return `Incoming raid with ${data.viewers} viewers!`
    }
    case 'redemption': {
      const data = event.data as RedemptionEventData
      return data.rewardTitle
    }
    case 'hype_train_begin': {
      const data = event.data as HypeTrainBeginEventData
      return `Level ${data.level} - Let's go!`
    }
    case 'shoutout': {
      const data = event.data as ShoutoutEventData
      return `Check out ${data.targetUsername}!`
    }
    default:
      return ''
  }
}

interface AlertDisplayProps {
  event: TwitchEvent
  animation: 'slide' | 'fade' | 'pop'
  onComplete: () => void
  duration: number
}

function AlertDisplay({
  event,
  animation,
  onComplete,
  duration
}: AlertDisplayProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const style = alertStyles[event.type] || alertStyles.follow

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))

    // Hide after duration
    const hideTimer = setTimeout(() => {
      setVisible(false)
    }, duration - 500)

    // Remove after animation out
    const removeTimer = setTimeout(onComplete, duration)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [duration, onComplete])

  const animationStyles = {
    slide: {
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      opacity: visible ? 1 : 0
    },
    fade: {
      opacity: visible ? 1 : 0
    },
    pop: {
      transform: visible ? 'scale(1)' : 'scale(0.5)',
      opacity: visible ? 1 : 0
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '350px',
        background: style.gradient,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        ...animationStyles[animation]
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src={
            event.profileImageUrl ||
            'https://static-cdn.jtvnw.net/user-default-pictures-uv/75305d54-c7cc-40d1-bb9c-91c7eb50f43e-profile_image-70x70.png'
          }
          alt=""
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.3)'
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 500,
              marginBottom: '4px'
            }}
          >
            {style.title}
          </div>
          <div
            style={{
              fontSize: '20px',
              color: 'white',
              fontWeight: 700
            }}
          >
            {event.displayName}
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.9)',
              marginTop: '4px'
            }}
          >
            {getAlertMessage(event)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Alerts() {
  const { duration, animation } = useMemo(() => getUrlParams(), [])
  const [queue, setQueue] = useState<TwitchEvent[]>([])
  const [currentAlert, setCurrentAlert] = useState<TwitchEvent | null>(null)

  const handleEvent = useCallback((event: TwitchEvent) => {
    if (ALERT_TYPES.includes(event.type)) {
      setQueue((prev) => [...prev, event])
    }
  }, [])

  useEventSocket({ onEvent: handleEvent })

  // Process queue
  useEffect(() => {
    if (!currentAlert && queue.length > 0) {
      setCurrentAlert(queue[0])
      setQueue((prev) => prev.slice(1))
    }
  }, [currentAlert, queue])

  const handleComplete = useCallback(() => {
    setCurrentAlert(null)
  }, [])

  return (
    <>
      {currentAlert && (
        <AlertDisplay
          event={currentAlert}
          animation={animation}
          duration={duration}
          onComplete={handleComplete}
        />
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Alerts />)
