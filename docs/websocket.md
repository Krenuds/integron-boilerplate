# WebSocket Protocol

Overlays connect to `ws://localhost:9847` to receive real-time events from the main process.

## Connection

```javascript
const ws = new WebSocket('ws://localhost:9847')

ws.onopen = () => console.log('Connected')
ws.onclose = () => console.log('Disconnected')
ws.onerror = (err) => console.error('Error:', err)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Event:', data)
}
```

## Message Format

All messages are JSON with this structure:

```json
{
  "type": "chat",
  "data": {
    "userId": "12345",
    "username": "viewer123",
    "message": "Hello!",
    "badges": ["subscriber"],
    "color": "#FF0000"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Event Types

| Type         | Data Fields                                        |
| ------------ | -------------------------------------------------- |
| `chat`       | userId, username, message, badges, color, emotes   |
| `sub`        | userId, username, tier, months, message, isGift    |
| `follow`     | userId, username                                   |
| `bits`       | userId, username, bits, message                    |
| `raid`       | userId, username, viewers                          |
| `redemption` | userId, username, rewardId, rewardTitle, userInput |
| `hypetrain`  | level, progress, goal                              |

## Adding Custom Event Types

### 1. Define the Type

```typescript
// src/shared/event-types.ts
export interface GoalUpdateEvent {
  type: 'goal_update'
  goalId: string
  current: number
  target: number
  label: string
}

// Add to TwitchEvent union type
export type TwitchEvent = ChatEvent | SubEvent | ... | GoalUpdateEvent
```

### 2. Broadcast from Main Process

```typescript
// In any main process file
import { broadcastEvent } from './server/websocket'

broadcastEvent({
  type: 'goal_update',
  goalId: 'bits_goal',
  current: 500,
  target: 1000,
  label: 'Bit Goal'
})
```

### 3. Handle in Overlay

```typescript
// In overlay component
const { events } = useEventSocket({ types: ['goal_update'] })

useEffect(() => {
  const goalEvents = events.filter((e) => e.type === 'goal_update')
  // Update UI based on goal events
}, [events])
```

## Reconnection

The `useEventSocket` hook handles reconnection automatically:

- Attempts to reconnect on disconnect
- Exponential backoff between attempts
- `connected` state reflects current status

For manual WebSocket connections, implement your own reconnection logic:

```javascript
function connect() {
  const ws = new WebSocket('ws://localhost:9847')

  ws.onclose = () => {
    setTimeout(connect, 3000) // Reconnect after 3s
  }

  return ws
}
```

## Server-Side Broadcasting

From the main process, broadcast events to all connected overlays:

```typescript
import { broadcastEvent, getConnectedClients } from './server/websocket'

// Send to all clients
broadcastEvent({ type: 'custom', data: { ... } })

// Check connection count
const count = getConnectedClients()
console.log(`${count} overlays connected`)
```
