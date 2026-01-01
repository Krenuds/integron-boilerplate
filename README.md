# Integron

Electron boilerplate for Twitch integrations. Provides OAuth, EventSub, SQLite persistence, and WebSocket-powered overlays for OBS.

## Quick Start

```bash
npm install
npm run dev
```

The Electron window is your **dashboard**. The HTTP server (port 9847) serves **overlay pages** for OBS browser sources.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ELECTRON MAIN PROCESS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │   Twurple   │  │    SQLite    │  │ HTTP Server │  │  WebSocket Server│   │
│  │  EventSub   │──│   Database   │──│  (Express)  │──│   (ws library)   │   │
│  │  WebSocket  │  │ (better-sq3) │  │  Port 9847  │  │   Port 9847/ws   │   │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────────┘   │
│         │                │                 │                   │            │
│         └────────────────┴─────────────────┴───────────────────┘            │
│                                    │                                        │
│                              Event Bus                                      │
│                                    │                                        │
│         ┌──────────────────────────┴──────────────────────────┐             │
│         │                     IPC Bridge                       │             │
└─────────┴──────────────────────────────────────────────────────┴────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
│  ELECTRON WINDOW │      │  OVERLAY PAGES   │      │   OBS Browser Source │
│  (Config/Dash)   │      │  (React builds)  │      │  http://localhost:   │
│                  │      │  /overlay/feed   │      │  9847/overlay/alerts │
│  - Dashboard     │      │  /overlay/alerts │      └──────────────────────┘
│  - Settings      │      │  /overlay/chat   │
│  - Event Log     │      └──────────────────┘
│  - Users         │
│  - Test Panel    │
└──────────────────┘
```

---

## Tech Stack

| Layer         | Technology                   | Purpose                              |
| ------------- | ---------------------------- | ------------------------------------ |
| Framework     | Electron 39 + electron-vite  | Desktop app framework                |
| UI Library    | Chakra UI                    | Component library (dark theme only)  |
| State         | React Context                | State management                     |
| Routing       | React Router v7              | Page navigation                      |
| Twitch API    | Twurple (all packages)       | OAuth, API, Chat, EventSub           |
| Database      | better-sqlite3 + Drizzle ORM | Local data persistence               |
| HTTP Server   | Express.js                   | Serve overlays and API               |
| WebSocket     | ws                           | Real-time overlay updates            |
| Token Storage | electron-store               | Secure credential storage            |
| Logging       | electron-log                 | File-based logging (3 file rotation) |

---

## Commands

| Command               | Purpose                                     |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Start development server with hot reload    |
| `npm run build`       | Build for production (runs typecheck first) |
| `npm run build:win`   | Build Windows installer                     |
| `npm run build:mac`   | Build macOS DMG                             |
| `npm run build:linux` | Build Linux packages                        |
| `npm run typecheck`   | Run all TypeScript checks                   |
| `npm run lint`        | Lint with ESLint                            |
| `npm run format`      | Format with Prettier                        |

---

## File Structure

```
src/
├── main/
│   ├── index.ts              # App entry, window, tray
│   ├── store.ts              # electron-store wrapper
│   ├── logger.ts             # Logging config
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   ├── schema.ts         # Drizzle schema
│   │   └── backup.ts         # Backup utility
│   ├── auth/
│   │   ├── index.ts          # Auth manager
│   │   └── twurple.ts        # Twurple AuthProvider
│   ├── twitch/
│   │   ├── index.ts          # Twitch client manager
│   │   ├── eventsub.ts       # EventSub listeners
│   │   └── chat.ts           # Chat client
│   ├── events/
│   │   ├── bus.ts            # Event emitter
│   │   ├── queue.ts          # Event queue
│   │   └── handlers.ts       # Event processing
│   ├── server/
│   │   ├── index.ts          # Express + WS server
│   │   ├── routes.ts         # API routes
│   │   └── websocket.ts      # WebSocket handler
│   └── ipc/
│       └── handlers.ts       # All IPC handlers
├── preload/
│   ├── index.ts              # Context bridge
│   └── index.d.ts            # Type definitions
├── renderer/
│   └── src/
│       ├── main.tsx          # Entry
│       ├── App.tsx           # Router + Layout
│       ├── theme.ts          # Chakra theme
│       ├── contexts/         # React contexts
│       ├── pages/            # Dashboard pages
│       └── components/       # Shared components
├── overlays/                  # Separate Vite build
│   ├── vite.config.ts
│   ├── src/
│   │   ├── Feed.tsx
│   │   ├── Alerts.tsx
│   │   ├── Chat.tsx
│   │   └── hooks/
│   │       └── useEventSocket.ts
│   └── package.json
└── shared/
    ├── ipc-types.ts          # Shared IPC types
    └── event-types.ts        # Event type definitions
```

---

## Database

### Schema

The database uses Drizzle ORM with better-sqlite3. Schema is defined in `src/main/db/schema.ts`.

#### users

| Column            | Type     | Description             |
| ----------------- | -------- | ----------------------- |
| id                | TEXT PK  | Twitch user ID          |
| username          | TEXT     | Login name              |
| display_name      | TEXT     | Display name            |
| profile_image_url | TEXT     | Avatar URL              |
| first_seen        | DATETIME | First interaction       |
| last_seen         | DATETIME | Most recent interaction |
| message_count     | INT      | Total chat messages     |
| bits_total        | INT      | Lifetime bits           |
| sub_months        | INT      | Cumulative sub months   |
| metadata          | JSON     | Extensible data         |

#### events

| Column     | Type     | Description                          |
| ---------- | -------- | ------------------------------------ |
| id         | INT PK   | Auto-increment ID                    |
| type       | TEXT     | Event type (chat, sub, follow, etc.) |
| user_id    | TEXT FK  | Reference to users.id                |
| data       | JSON     | Full event payload                   |
| created_at | DATETIME | Event timestamp                      |

Indexed on `(type, created_at)` for efficient queries.

#### settings

| Column | Type    | Description        |
| ------ | ------- | ------------------ |
| key    | TEXT PK | Setting key        |
| value  | TEXT    | JSON-encoded value |

### Location

- **Database file**: `%APPDATA%/integron/integron.db`
- **Backups**: `%APPDATA%/integron/backups/` (auto-created on app start)

### Usage Examples

```typescript
import { getDatabase } from '../db'
import { users, events } from '../db/schema'
import { eq, desc, gte } from 'drizzle-orm'

const db = getDatabase()

// Get a user by ID
const user = db.select().from(users).where(eq(users.id, '12345')).get()

// Get all users sorted by message count
const topChatters = db
  .select()
  .from(users)
  .orderBy(desc(users.messageCount))
  .limit(10)
  .all()

// Get recent events
const recentEvents = db
  .select()
  .from(events)
  .orderBy(desc(events.createdAt))
  .limit(50)
  .all()

// Insert a new user
db.insert(users)
  .values({
    id: '12345',
    username: 'viewer123',
    firstSeen: new Date(),
    lastSeen: new Date()
  })
  .run()

// Update user stats
db.update(users)
  .set({ messageCount: sql`${users.messageCount} + 1`, lastSeen: new Date() })
  .where(eq(users.id, '12345'))
  .run()

// Delete user (events are deleted first due to FK constraint)
db.delete(events).where(eq(events.userId, '12345')).run()
db.delete(users).where(eq(users.id, '12345')).run()
```

### Adding New Tables

1. Define the table in `src/main/db/schema.ts`:

```typescript
export const rewards = sqliteTable('rewards', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  claimedAt: integer('claimed_at', { mode: 'timestamp' })
})

export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
```

2. The table is auto-created on app start (Drizzle push mode in development).

3. For production migrations, see [Drizzle Kit documentation](https://orm.drizzle.team/kit-docs/overview).

---

## Overlays

React pages served via HTTP at `http://localhost:9847`, designed for OBS browser sources.

### Built-in Overlays

#### Alerts (`/overlay/alerts.html`)

Popup notifications for subs, bits, follows, raids, etc.

| Parameter   | Default | Description                          |
| ----------- | ------- | ------------------------------------ |
| `duration`  | `5000`  | Alert display time in ms             |
| `animation` | `slide` | Animation type: `slide`, `fade`, `pop` |

```
http://localhost:9847/overlay/alerts.html?duration=3000&animation=pop
```

#### Chat (`/overlay/chat.html`)

Recent chat messages with badges and user colors.

| Parameter | Default | Description           |
| --------- | ------- | --------------------- |
| `max`     | `10`    | Max messages shown    |
| `fade`    | `30000` | Message lifetime in ms |

```
http://localhost:9847/overlay/chat.html?max=15&fade=45000
```

#### Feed (`/overlay/feed.html`)

Scrolling event log (all event types).

| Parameter | Default | Description                          |
| --------- | ------- | ------------------------------------ |
| `max`     | `50`    | Max events shown                     |
| `types`   | all     | Filter: `chat,sub,follow,bits,raid` |

```
http://localhost:9847/overlay/feed.html?types=sub,follow,raid&max=100
```

### Creating New Overlays

1. Create a new component in `src/overlays/src/`:

```tsx
// src/overlays/src/Goals.tsx
import { useEventSocket } from './hooks/useEventSocket'
import { useEffect, useState } from 'react'

export default function Goals() {
  const { events, connected } = useEventSocket()
  const [bitGoal, setBitGoal] = useState(0)

  useEffect(() => {
    events
      .filter((e) => e.type === 'bits')
      .forEach((e) => {
        setBitGoal((prev) => prev + (e.data.bits || 0))
      })
  }, [events])

  return (
    <div className="goal-container">
      <div className="goal-bar" style={{ width: `${(bitGoal / 1000) * 100}%` }} />
      <span>
        {bitGoal} / 1000 bits
      </span>
    </div>
  )
}
```

2. Add an HTML entry point in `src/overlays/`:

```html
<!-- src/overlays/goals.html -->
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Goals Overlay</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/goals-entry.tsx"></script>
  </body>
</html>
```

3. Create the entry file:

```tsx
// src/overlays/src/goals-entry.tsx
import { createRoot } from 'react-dom/client'
import Goals from './Goals'

createRoot(document.getElementById('root')!).render(<Goals />)
```

4. Add to Vite config `src/overlays/vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    input: {
      alerts: resolve(__dirname, 'alerts.html'),
      chat: resolve(__dirname, 'chat.html'),
      feed: resolve(__dirname, 'feed.html'),
      goals: resolve(__dirname, 'goals.html')  // Add this
    }
  }
}
```

5. Access at `http://localhost:9847/overlay/goals.html`

### WebSocket Hook

All overlays use `useEventSocket` to receive real-time events:

```typescript
const { events, connected, lastEvent } = useEventSocket({
  maxEvents: 100, // Buffer size
  types: ['sub', 'bits', 'follow'] // Filter event types (optional)
})
```

---

## IPC Channels

Typed end-to-end communication between renderer and main process.

### Available Channels

#### Auth

- `auth:get-status` - Returns `{ authenticated, channel }`
- `auth:start-login` - Opens browser for OAuth
- `auth:logout` - Clears tokens
- `auth:save-credentials` - Stores client ID/secret

#### Events

- `events:get-recent` - Returns `Event[]`
- `events:test-fire` - Simulates an event
- `events:subscribe` - Start receiving live events

#### Users

- `users:get-all` - Returns paginated `User[]`
- `users:get-by-id` - Returns single `User`
- `users:delete` - Removes user and their events

#### Server

- `server:get-status` - Returns `{ running, port, connections }`
- `server:restart` - Restart HTTP/WS server

#### Settings

- `settings:get` - Returns all settings
- `settings:update` - Updates settings

### Adding New IPC Channels

1. Define types in `src/shared/ipc-types.ts`:

```typescript
export interface RewardData {
  userId: string
  type: string
  amount: number
}

// Add to existing types or create new interfaces
```

2. Add handler in `src/main/ipc/handlers.ts`:

```typescript
ipcMain.handle('rewards:create', (_event, data: RewardData): Reward => {
  const db = getDatabase()
  const reward = {
    id: crypto.randomUUID(),
    ...data,
    claimedAt: new Date()
  }
  db.insert(rewards).values(reward).run()
  return reward
})

ipcMain.handle('rewards:get-user', (_event, userId: string): Reward[] => {
  const db = getDatabase()
  return db.select().from(rewards).where(eq(rewards.userId, userId)).all()
})
```

3. Expose in preload `src/preload/index.ts`:

```typescript
const api = {
  // ... existing methods
  createReward: (data: RewardData) => ipcRenderer.invoke('rewards:create', data),
  getUserRewards: (userId: string) => ipcRenderer.invoke('rewards:get-user', userId)
}
```

4. Add types to `src/preload/index.d.ts`:

```typescript
interface Api {
  // ... existing methods
  createReward(data: RewardData): Promise<Reward>
  getUserRewards(userId: string): Promise<Reward[]>
}
```

5. Use in renderer:

```typescript
const reward = await window.api.createReward({
  userId: '12345',
  type: 'daily_bonus',
  amount: 100
})
```

---

## WebSocket Protocol

Overlays connect to `ws://localhost:9847` and receive JSON messages:

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

### Event Types

| Type         | Data Fields                                          |
| ------------ | ---------------------------------------------------- |
| `chat`       | userId, username, message, badges, color, emotes     |
| `sub`        | userId, username, tier, months, message, isGift      |
| `follow`     | userId, username                                     |
| `bits`       | userId, username, bits, message                      |
| `raid`       | userId, username, viewers                            |
| `redemption` | userId, username, rewardId, rewardTitle, userInput   |
| `hypetrain`  | level, progress, goal                                |

### Adding Custom Event Types

1. Define in `src/shared/event-types.ts`:

```typescript
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

2. Broadcast from main process:

```typescript
import { broadcastEvent } from './server/websocket'

broadcastEvent({
  type: 'goal_update',
  goalId: 'bits_goal',
  current: 500,
  target: 1000,
  label: 'Bit Goal'
})
```

3. Handle in overlay:

```typescript
const { events } = useEventSocket({ types: ['goal_update'] })

useEffect(() => {
  const goalEvents = events.filter((e) => e.type === 'goal_update')
  // Update UI
}, [events])
```

---

## Twitch Integration

### OAuth Scopes

All available broadcaster scopes are requested:

- `chat:read`, `chat:edit` - Chat access
- `channel:read:subscriptions` - Subscriber data
- `channel:read:redemptions` - Channel points
- `bits:read` - Bits/cheers
- `moderator:read:followers` - Follower events
- `channel:read:hype_train` - Hype trains
- `channel:read:polls` - Poll events
- `channel:read:predictions` - Prediction events

### Events Listened

| Event                            | Source      | Persisted      |
| -------------------------------- | ----------- | -------------- |
| Chat messages                    | Chat client | User data only |
| Subscriptions (new, resub, gift) | EventSub    | Yes            |
| Channel point redemptions        | EventSub    | Yes            |
| Follows                          | EventSub    | Yes            |
| Bits/Cheers                      | EventSub    | Yes            |
| Raids                            | EventSub    | Yes            |
| Hype trains                      | EventSub    | Yes            |
| Polls                            | EventSub    | No             |
| Predictions                      | EventSub    | No             |
| Shoutouts                        | EventSub    | No             |

### Token Management

- Tokens stored in electron-store (encrypted at OS level)
- Automatic silent refresh using Twurple's RefreshingAuthProvider
- Refresh tokens persisted for "remember me" functionality
- Single broadcaster account supported

### Adding New Scopes

1. Update scope list in `src/main/auth/index.ts`
2. User must re-authenticate to grant new scopes
3. Add EventSub listener in `src/main/twitch/eventsub.ts`

---

## Dashboard Pages

### Dashboard (`/`)

- Connection status indicators (Twitch, server, WebSocket)
- Quick stats (total users, events today, connected overlays)
- Recent event preview

### Settings (`/settings`)

- OAuth credentials form (Client ID, Client Secret)
- Connect/Disconnect Twitch account
- Server port configuration
- Log level toggle

### Event Log (`/events`)

- Real-time scrolling event stream
- Filter by event type (checkboxes)
- Search by username
- Timestamp display

### Users (`/users`)

- Paginated user table
- Sortable columns (messages, last seen, bits, sub months)
- Click for user detail view
- Delete user option

### Test Panel (`/test`)

- Buttons to simulate each event type
- Custom JSON payload editor
- Event preview before sending

---

## HTTP Server

### Port

**9847** - Both HTTP and WebSocket (HTTP upgrade)

### Endpoints

| Route            | Purpose                         |
| ---------------- | ------------------------------- |
| `/overlay/*`     | Serve built overlay React pages |
| `/api/events`    | REST: Get recent events         |
| `/api/users`     | REST: Get user data             |
| `/auth/callback` | OAuth callback handler          |

---

## Logging

- **Level**: Debug (all) by default
- **Output**: Console + file
- **Rotation**: Keep latest 3 log files
- **Location**: `%APPDATA%/integron/logs/`

---

## System Tray

- Tray icon with context menu
- Show/Hide window toggle
- Connection status indicator
- Quick links to overlay URLs
- Quit option
- Minimize to tray on window close

---

## Security

- Context isolation enabled
- Credentials stored in electron-store (OS-level encryption)
- No additional encryption layer
- No machine binding
- No password lock feature
- Sandbox disabled for Node.js access (required for sqlite)

---

## Design Guidelines

- **Theme**: Dark mode only
- **Style**: Minimal, compact, sparse
- **Focus**: Functionality over aesthetics
- **Customization**: CSS-friendly for developers to restyle
- **Boilerplate philosophy**: Clean foundation for creativity

---

## TypeScript Configuration

Three separate tsconfig files:

- `tsconfig.node.json` - Main and preload processes
- `tsconfig.web.json` - Renderer process (includes path alias `@renderer/*` → `src/renderer/src/*`)
- `tsconfig.json` - Composite root

## Code Style

- Single quotes, no semicolons, 100 char line width
- No trailing commas
- Configured in `.prettierrc.yaml` and `eslint.config.mjs`

## Key Patterns

- Import images with `?asset` suffix for Vite handling
- Preload exposes APIs through `window.electron` (from @electron-toolkit) and `window.api` (custom)
- Context isolation enabled, sandbox disabled for Node access

---

## IDE Setup

[VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
