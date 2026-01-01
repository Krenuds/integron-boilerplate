# Getting Started

This guide covers how to extend Integron for your own projects.

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── db/schema.ts         # Database tables
│   ├── events/bus.ts        # Internal event system
│   ├── events/handlers.ts   # Event processing
│   ├── ipc/handlers.ts      # Renderer communication
│   ├── twitch/eventsub.ts   # Twitch event listeners
│   └── server/websocket.ts  # Overlay broadcasting
├── renderer/src/            # Dashboard UI (React)
├── overlays/src/            # OBS overlays (React)
└── shared/                  # Types shared between processes
    ├── event-types.ts       # Twitch event definitions
    └── ipc-types.ts         # IPC channel types
```

## Add a New Event Type

**1. Define the type** (`src/shared/event-types.ts`):

```typescript
export type EventType =
  | 'chat'
  | 'sub'
  // ...existing types
  | 'my_custom_event'  // Add here

export interface MyCustomEventData {
  someValue: number
  message: string
}

export type EventData =
  | ChatEventData
  // ...existing types
  | MyCustomEventData  // Add here
```

**2. Emit from Twitch listener** (`src/main/twitch/eventsub.ts`):

```typescript
listener.onSomeEvent((event) => {
  eventBus.emitEvent({
    id: Date.now(),
    type: 'my_custom_event',
    userId: event.userId,
    username: event.userName,
    displayName: event.userDisplayName,
    createdAt: new Date().toISOString(),
    data: {
      someValue: event.value,
      message: event.message
    }
  })
})
```

Events automatically:
- Broadcast to all connected overlays via WebSocket
- Save to SQLite database
- Appear in dashboard event log

## Add an IPC Channel

IPC lets the dashboard UI communicate with the main process.

**1. Define types** (`src/shared/ipc-types.ts`):

```typescript
export interface LoyaltyPoints {
  userId: string
  points: number
}
```

**2. Add handler** (`src/main/ipc/handlers.ts`):

```typescript
ipcMain.handle('loyalty:get', (_event, userId: string): number => {
  const db = getDatabase()
  const user = db.select().from(users).where(eq(users.id, userId)).get()
  return (user?.metadata as any)?.loyaltyPoints ?? 0
})

ipcMain.handle('loyalty:add', (_event, userId: string, amount: number): void => {
  // Update user's loyalty points
})
```

**3. Expose in preload** (`src/preload/index.ts`):

```typescript
const api = {
  // ...existing methods
  getLoyaltyPoints: (userId: string) => ipcRenderer.invoke('loyalty:get', userId),
  addLoyaltyPoints: (userId: string, amount: number) => ipcRenderer.invoke('loyalty:add', userId, amount)
}
```

**4. Add type declarations** (`src/preload/index.d.ts`):

```typescript
interface Api {
  // ...existing methods
  getLoyaltyPoints(userId: string): Promise<number>
  addLoyaltyPoints(userId: string, amount: number): Promise<void>
}
```

**5. Use in React**:

```typescript
const points = await window.api.getLoyaltyPoints('12345')
await window.api.addLoyaltyPoints('12345', 100)
```

## Add a Database Table

Uses Drizzle ORM with SQLite.

**1. Define schema** (`src/main/db/schema.ts`):

```typescript
export const rewards = sqliteTable('rewards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  claimedAt: integer('claimed_at', { mode: 'timestamp' }).notNull()
})

export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
```

**2. Query it**:

```typescript
import { getDatabase } from '../db'
import { rewards } from '../db/schema'

const db = getDatabase()

// Insert
db.insert(rewards).values({
  userId: '12345',
  type: 'daily',
  amount: 100,
  claimedAt: new Date()
}).run()

// Query
const userRewards = db
  .select()
  .from(rewards)
  .where(eq(rewards.userId, '12345'))
  .all()
```

Table is created automatically on first run.

## Create an Overlay

Overlays are React pages served at `http://localhost:9847/overlay/`.

**1. Create component** (`src/overlays/src/MyOverlay.tsx`):

```typescript
import { createRoot } from 'react-dom/client'
import { useEventSocket } from './hooks/useEventSocket'

function MyOverlay() {
  const { connected, events } = useEventSocket({
    eventTypes: ['bits', 'sub'],  // Filter events
    onEvent: (event) => {
      // Handle immediately
      console.log('Got event:', event)
    }
  })

  return (
    <div style={{ color: 'white' }}>
      {events.map((e) => (
        <div key={e.id}>{e.displayName}: {JSON.stringify(e.data)}</div>
      ))}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<MyOverlay />)
```

**2. Add HTML entry** (`src/overlays/my-overlay.html`):

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; background: transparent; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/MyOverlay.tsx"></script>
  </body>
</html>
```

**3. Add to Vite config** (`src/overlays/vite.config.ts`):

```typescript
build: {
  rollupOptions: {
    input: {
      // ...existing entries
      'my-overlay': resolve(__dirname, 'my-overlay.html')
    }
  }
}
```

Available at `http://localhost:9847/overlay/my-overlay.html`

## WebSocket Message Format

Overlays receive events in this format:

```typescript
interface WebSocketMessage {
  type: 'connected' | 'event'
  clientId?: string
  event?: {
    id: number
    type: EventType
    userId: string
    username: string
    displayName: string
    profileImageUrl?: string
    data: EventData
    createdAt: string
  }
  timestamp: string
}
```

## Event Bus

Internal events flow through the event bus before reaching overlays.

```typescript
import { eventBus } from '../events/bus'

// Listen to all events
eventBus.onEvent((event) => {
  console.log('Event received:', event.type)
})

// Emit custom event
eventBus.emitEvent({
  id: Date.now(),
  type: 'my_custom_event',
  userId: '12345',
  username: 'someone',
  displayName: 'Someone',
  createdAt: new Date().toISOString(),
  data: { /* your data */ }
})
```

## URL Parameters

Built-in overlays support URL params:

```
/overlay/alerts.html?duration=5000&animation=slide
/overlay/chat.html?max=10&fade=30000
/overlay/feed.html?max=50&types=chat,sub
```

Add your own by parsing `window.location.search`.

## Tips

- Run `npm run dev` for hot reload during development
- Events auto-persist to `%APPDATA%/integron/database.db`
- Logs go to `%APPDATA%/integron/logs/`
- Test events from the dashboard Test Panel without needing live Twitch data
- Overlays reconnect automatically if the server restarts
