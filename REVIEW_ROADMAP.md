# Integron Code Review & Architecture Guide

**Review Date:** Phase 11 Complete
**Status:** All systems operational, no known bugs

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Breakdown](#module-breakdown)
   - [Main Process](#main-process)
   - [Preload Bridge](#preload-bridge)
   - [Renderer (Dashboard)](#renderer-dashboard)
   - [Overlays](#overlays)
   - [Shared Types](#shared-types)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Module Interactions](#module-interactions)
5. [Key Singletons](#key-singletons)
6. [Security Considerations](#security-considerations)
7. [Future Considerations](#future-considerations)

---

## Architecture Overview

Integron follows a three-process Electron architecture with an additional HTTP/WebSocket server for OBS overlays:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MAIN PROCESS (Node.js)                          │
│                                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Auth   │  │   DB    │  │ Events  │  │ Twitch  │  │    Server    │  │
│  │ Module  │◄─┤ Module  │◄─┤ Module  │◄─┤ Module  │◄─┤   Module     │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬───────┘  │
│       │            │            │            │               │          │
│       └────────────┴────────────┴────────────┴───────────────┘          │
│                              │                                          │
│                         Event Bus                                       │
│                              │                                          │
│  ┌───────────────────────────┴───────────────────────────────────────┐  │
│  │                        IPC Handlers                                │  │
│  └───────────────────────────┬───────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │   PRELOAD     │  │    HTTP       │  │   WebSocket   │
    │   BRIDGE      │  │   :9847       │  │   :9847       │
    └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │   RENDERER    │  │   OVERLAYS    │  │  OBS BROWSER  │
    │  (Dashboard)  │  │   (React)     │  │    SOURCE     │
    └───────────────┘  └───────────────┘  └───────────────┘
```

---

## Module Breakdown

### Main Process

The main process is the backbone of Integron, managing all core functionality.

#### `src/main/index.ts` - Application Entry Point

**Purpose:** Initializes the Electron app, creates the main window, and orchestrates startup.

**Key Responsibilities:**
- App lifecycle management (ready, quit, window-all-closed)
- Main window creation with security settings
- Initialization sequence: Database → IPC → Window → Tray
- Tray-to-minimize behavior (window hides on close)

**Initialization Order:**
1. `initDatabase()` - Opens SQLite, creates tables
2. `initializeIpc()` - Registers handlers, starts auth, starts server
3. `createWindow()` - Creates BrowserWindow
4. `createTray()` - Sets up system tray

**Cleanup Order:**
1. `destroyTray()` - Removes tray icon
2. `overlayServer.stop()` - Closes HTTP/WS server
3. `closeDatabase()` - Closes SQLite connection

---

#### `src/main/store.ts` - Credential Storage

**Purpose:** Secure storage for OAuth credentials and tokens using `electron-store`.

**Stored Data:**
| Key | Type | Description |
|-----|------|-------------|
| `credentials` | `{clientId, clientSecret}` | Twitch app credentials |
| `tokens` | `TokenData` | OAuth access/refresh tokens |
| `broadcasterId` | `string` | Twitch user ID |
| `broadcasterLogin` | `string` | Twitch username |
| `broadcasterProfileImageUrl` | `string` | Avatar URL |

**Storage Location:** `%APPDATA%/integron-boilerplate/integron-credentials.json`

**Exports:**
- `getCredentials()` / `setCredentials()` / `clearCredentials()`
- `getTokens()` / `setTokens()` / `clearTokens()`
- `getBroadcaster()` / `setBroadcaster()` / `clearBroadcaster()`

---

#### `src/main/logger.ts` - File Logging

**Purpose:** Configures `electron-log` for file and console output.

**Configuration:**
- File location: `%APPDATA%/integron-boilerplate/logs/main.log`
- Max file size: 5MB
- Rotation: Keeps 3 files (main.log → main.1.log → main.2.log)
- Default level: `debug` (all messages)

**Exports:**
- `logger` - Configured electron-log instance
- `setLogLevel(level)` - Runtime level adjustment
- `getLogsPath()` - Returns logs directory

---

#### `src/main/tray.ts` - System Tray

**Purpose:** Manages the system tray icon and context menu.

**Features:**
- Click to show/hide main window
- Connection status display
- Quick links to overlay URLs
- Quit option

**Menu Structure:**
```
├── Show/Hide Window
├── ─────────────────
├── Status: Connected/Disconnected
├── ─────────────────
├── Overlay URLs ►
│   ├── Feed Overlay
│   ├── Alerts Overlay
│   └── Chat Overlay
├── ─────────────────
└── Quit
```

---

### Auth Module (`src/main/auth/`)

#### `index.ts` - OAuth Flow Manager

**Purpose:** Handles Twitch OAuth authentication flow.

**Flow:**
1. User clicks "Connect" in Settings
2. `startOAuthFlow()` starts local callback server on `:9848`
3. Opens browser to Twitch authorization URL
4. User authorizes on Twitch
5. Twitch redirects to `localhost:9848/callback`
6. `exchangeCodeForTokens()` trades code for tokens
7. `fetchAndStoreBroadcasterInfo()` gets user profile
8. `createAuthProvider()` initializes Twurple
9. `initializeTwitch()` connects chat & EventSub

**Requested Scopes:**
```
chat:read, chat:edit, channel:read:subscriptions,
channel:read:redemptions, bits:read, moderator:read:followers,
channel:read:hype_train, channel:read:polls,
channel:read:predictions, channel:manage:raids,
moderator:read:shoutouts
```

#### `twurple.ts` - Auth Provider

**Purpose:** Creates and manages Twurple's `RefreshingAuthProvider`.

**Key Features:**
- Auto-refreshes expired tokens
- Persists new tokens via `onRefresh` callback
- Creates `ApiClient` for Helix API calls

---

### Database Module (`src/main/db/`)

#### `index.ts` - Database Connection

**Purpose:** SQLite connection management using `better-sqlite3` + `drizzle-orm`.

**Database Location:** `%APPDATA%/integron-boilerplate/integron.db`

**Configuration:**
- WAL mode enabled for better concurrent access
- Auto-backup on startup

**Tables Created:**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  message_count INTEGER DEFAULT 0,
  bits_total INTEGER DEFAULT 0,
  sub_months INTEGER DEFAULT 0,
  metadata TEXT
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  data TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX events_type_created_idx ON events(type, created_at);
```

#### `schema.ts` - Drizzle Schema

**Purpose:** Type-safe schema definitions for Drizzle ORM.

**Exports:**
- `users`, `events`, `settings` - Table definitions
- `User`, `NewUser`, `Event`, `NewEvent`, `Setting` - TypeScript types

#### `backup.ts` - Database Backups

**Purpose:** Automatic database backup on startup.

**Features:**
- Creates timestamped backups
- Includes WAL/SHM files
- Keeps maximum 5 backups
- Auto-cleans old backups

**Backup Location:** `%APPDATA%/integron-boilerplate/backups/`

---

### Twitch Module (`src/main/twitch/`)

#### `index.ts` - Connection Manager

**Purpose:** Coordinates Twitch chat and EventSub connections.

**Exports:**
- `initializeTwitch()` - Connects both chat and EventSub
- `disconnectTwitch()` - Disconnects both
- `getTwitchStatus()` - Returns connection state
- `eventBus` - Re-exported for external access

#### `chat.ts` - Chat Client

**Purpose:** Manages TMI/chat connection using `@twurple/chat`.

**Handled Events:**
| Event | Twurple Handler | Output Type |
|-------|-----------------|-------------|
| Messages | `onMessage` | `chat` |
| Subscriptions | `onSub` | `sub` |
| Resubscriptions | `onResub` | `resub` |
| Gift Subs | `onSubGift` | `gift_sub` |
| Community Gifts | `onCommunitySub` | `gift_sub` |
| Raids | `onRaid` | `raid` |

**Connection Events:** Emits `connected`/`disconnected` to eventBus.

#### `eventsub.ts` - EventSub WebSocket

**Purpose:** Real-time event subscriptions via `@twurple/eventsub-ws`.

**Subscribed Events:**
| Event | Twurple Handler | Output Type |
|-------|-----------------|-------------|
| Follows | `onChannelFollow` | `follow` |
| Redemptions | `onChannelRedemptionAdd` | `redemption` |
| Hype Train Start | `onChannelHypeTrainBegin` | `hype_train_begin` |
| Hype Train End | `onChannelHypeTrainEnd` | `hype_train_end` |
| Poll Start | `onChannelPollBegin` | `poll_begin` |
| Poll End | `onChannelPollEnd` | `poll_end` |
| Prediction Start | `onChannelPredictionBegin` | `prediction_begin` |
| Prediction End | `onChannelPredictionEnd` | `prediction_end` |
| Shoutouts | `onChannelShoutoutCreate` | `shoutout` |

---

### Events Module (`src/main/events/`)

#### `bus.ts` - Event Bus

**Purpose:** Central event distribution using Node.js EventEmitter.

**Events:**
| Event | Payload | Description |
|-------|---------|-------------|
| `event` | `TwitchEvent` | Any Twitch event |
| `connected` | `{type, channel}` | Chat/EventSub connected |
| `disconnected` | `{type, reason}` | Chat/EventSub disconnected |
| `error` | `{type, error}` | Connection error |

**Usage Pattern:**
```typescript
eventBus.emitEvent(event)      // From chat/eventsub
eventBus.onEvent(handler)      // From server/renderer
```

#### `queue.ts` - Event Queue

**Purpose:** Circular buffer for in-memory event storage.

**Configuration:**
- Max size: 1000 events
- Oldest events dropped when full

**Methods:**
- `push(event)` - Add event
- `getRecent(count)` - Get last N events
- `getAll()` - Get all events
- `clear()` - Empty queue

#### `handlers.ts` - Event Processing

**Purpose:** Central event processing pipeline.

**Processing Steps:**
1. Log event receipt
2. Upsert user in database (fetch profile image if needed)
3. Update user statistics (message count, bits, sub months)
4. Persist event if type is persistent
5. Add to in-memory queue
6. Emit to event bus
7. Broadcast to renderer windows via IPC

**Persistent Event Types:**
```typescript
['sub', 'resub', 'gift_sub', 'bits', 'follow', 'raid',
 'redemption', 'hype_train_begin', 'hype_train_end']
```

**Non-Persistent Types:** `chat`, `poll_*`, `prediction_*`, `shoutout`

---

### Server Module (`src/main/server/`)

#### `index.ts` - HTTP Server

**Purpose:** Express server for API and overlay static files.

**Port:** 9847

**Endpoints:**
| Route | Purpose |
|-------|---------|
| `/api/*` | REST API (events, users, status) |
| `/overlay/*` | Static overlay files |
| `/health` | Health check |

**Middleware:**
- JSON body parser
- CORS headers (allows all origins)

**Connection to Event Bus:**
```typescript
eventBus.onEvent((event) => {
  wsHandler.broadcast(event)
})
```

#### `routes.ts` - API Routes

**Purpose:** REST API endpoints for overlays and external clients.

**Endpoints:**
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | Get recent events (from queue) |
| GET | `/api/users` | Get paginated user list |
| GET | `/api/users/:id` | Get single user |
| GET | `/api/status` | Server status |

**Query Parameters:**
- `/api/events?limit=50&type=chat,sub`
- `/api/users?limit=50&offset=0`

#### `websocket.ts` - WebSocket Handler

**Purpose:** Real-time event broadcast to overlay clients.

**Protocol:**
```json
// Server → Client (on connect)
{"type": "connected", "clientId": "client_1", "timestamp": "..."}

// Server → Client (on event)
{"type": "event", "event": {...}, "timestamp": "..."}
```

**Features:**
- Client connection tracking
- 30-second heartbeat (ping/pong)
- Automatic dead connection cleanup

---

### IPC Module (`src/main/ipc/handlers.ts`)

**Purpose:** Typed IPC communication between main and renderer processes.

**Channels:**

| Channel | Params | Returns |
|---------|--------|---------|
| `auth:get-status` | void | AuthStatus |
| `auth:start-login` | void | void |
| `auth:logout` | void | void |
| `auth:save-credentials` | Credentials | void |
| `auth:get-credentials` | void | Credentials |
| `events:get-recent` | EventListParams | EventListResult |
| `events:test-fire` | {type, data} | void |
| `events:get-queue` | number | TwitchEvent[] |
| `users:get-all` | UserListParams | UserListResult |
| `users:get-by-id` | string | User |
| `users:delete` | string | void |
| `server:get-status` | void | ServerStatus |
| `server:restart` | void | void |
| `twitch:get-status` | void | TwitchStatus |
| `settings:get` | void | Settings |
| `settings:update` | Partial<Settings> | void |

**Push Channels (main → renderer):**
- `event:new` - New Twitch event
- `auth:changed` - Auth status changed

---

### Preload Bridge

#### `src/preload/index.ts`

**Purpose:** Secure bridge between main and renderer processes.

**Exposed APIs:**
- `window.electron` - Standard Electron toolkit APIs
- `window.api` - Custom typed API (see IPC channels above)

**Pattern:** Uses `contextBridge.exposeInMainWorld()` with context isolation.

**Event Subscriptions:**
```typescript
window.api.onEvent(callback)      // Returns unsubscribe function
window.api.onAuthChange(callback) // Returns unsubscribe function
```

---

### Renderer (Dashboard)

#### `src/renderer/src/App.tsx` - Router

**Purpose:** React Router configuration.

**Routes:**
| Path | Component | Description |
|------|-----------|-------------|
| `/` | Dashboard | Status overview |
| `/settings` | Settings | Credentials & connection |
| `/events` | Events | Event log viewer |
| `/users` | Users | User management |
| `/test` | TestPanel | Test event buttons |

#### Contexts

**`AuthContext.tsx`:**
- Manages auth state across the app
- Listens for `auth:changed` events
- Provides `status`, `credentials`, `startLogin()`, `logout()`

**`EventContext.tsx`:**
- Manages event list and Twitch connection status
- Listens for `event:new` events
- Polls Twitch status every 5 seconds
- Provides `events`, `twitchStatus`, `fireTestEvent()`

#### Components

**`Layout.tsx`:** Sidebar + main content wrapper
**`Sidebar.tsx`:** Navigation menu

#### Pages

**`Dashboard.tsx`:**
- Connection status indicators
- User count, events today
- Recent events preview

**`Settings.tsx`:**
- Client ID/Secret form
- Connect/Disconnect buttons
- Setup instructions

**`Events.tsx`:**
- Paginated event table
- Type filter checkboxes
- Real-time updates

**`Users.tsx`:**
- Sortable user table
- Pagination
- Delete user action

**`TestPanel.tsx`:**
- Event type buttons
- Custom JSON payload editor

---

### Overlays

#### Build Configuration (`src/overlays/vite.config.ts`)

Separate Vite build outputting to `out/overlays/`:
- `feed.html` / `Feed.tsx`
- `alerts.html` / `Alerts.tsx`
- `chat.html` / `Chat.tsx`

#### `useEventSocket.ts` - WebSocket Hook

**Purpose:** React hook for WebSocket connection to main process.

**Features:**
- Auto-connect on mount
- Auto-reconnect (up to 10 attempts, 3s delay)
- Event type filtering
- Connection state tracking

**Usage:**
```typescript
const { connected, events, clearEvents } = useEventSocket({
  eventTypes: ['chat', 'sub'],
  onEvent: (event) => console.log(event)
})
```

#### Overlay Pages

**Feed.tsx:**
- Scrolling event list
- Auto-scroll to bottom
- URL params: `?max=50&types=chat,sub`

**Alerts.tsx:**
- Popup notifications
- Animated entrance/exit
- URL params: `?duration=5000`

**Chat.tsx:**
- Chat messages only
- Username colors, badges
- URL params: `?max=10`

---

### Shared Types

#### `src/shared/event-types.ts`

**Event Types:**
```typescript
type EventType =
  | 'chat' | 'sub' | 'resub' | 'gift_sub'
  | 'bits' | 'follow' | 'raid' | 'redemption'
  | 'hype_train_begin' | 'hype_train_end'
  | 'poll_begin' | 'poll_end'
  | 'prediction_begin' | 'prediction_end'
  | 'shoutout'
```

**Event Data Interfaces:** Type-specific data structures for each event type.

#### `src/shared/ipc-types.ts`

**Shared Interfaces:**
- `AuthStatus`, `Credentials`
- `User`, `UserListParams`, `UserListResult`
- `TwitchEvent`, `EventListParams`, `EventListResult`
- `ServerStatus`, `TwitchStatus`, `Settings`

**IPC Channel Map:** Type-safe channel → params → result mapping.

---

## Data Flow Diagrams

### Twitch Event Flow

```
Twitch Servers
     │
     ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Chat Client       │    │   EventSub Client   │
│   (twurple/chat)    │    │   (twurple/eventsub)│
└─────────┬───────────┘    └─────────┬───────────┘
          │                          │
          │    TwitchEvent           │
          └──────────┬───────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   handleTwitchEvent  │
          │   (events/handlers)  │
          └──────────┬───────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌─────────┐   ┌───────────┐   ┌───────────┐
│  SQLite │   │   Event   │   │   Event   │
│   DB    │   │   Queue   │   │    Bus    │
└─────────┘   └───────────┘   └─────┬─────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
             ┌───────────┐   ┌───────────┐   ┌───────────┐
             │  Renderer │   │ WebSocket │   │  Logger   │
             │   (IPC)   │   │ Broadcast │   │           │
             └───────────┘   └───────────┘   └───────────┘
```

### Authentication Flow

```
User clicks "Connect"
        │
        ▼
┌───────────────────┐     ┌───────────────────┐
│  startOAuthFlow() │────▶│ Start callback    │
│  (auth/index.ts)  │     │ server :9848      │
└───────────────────┘     └───────────────────┘
        │
        ▼
┌───────────────────┐
│ Open browser to   │
│ Twitch OAuth URL  │
└───────────────────┘
        │
        │ User authorizes
        ▼
┌───────────────────┐     ┌───────────────────┐
│ Twitch redirects  │────▶│ Callback handler  │
│ to localhost:9848 │     │ receives code     │
└───────────────────┘     └───────────────────┘
        │
        ▼
┌───────────────────┐     ┌───────────────────┐
│ exchangeCodeFor   │────▶│ Store tokens in   │
│ Tokens()          │     │ electron-store    │
└───────────────────┘     └───────────────────┘
        │
        ▼
┌───────────────────┐     ┌───────────────────┐
│ createAuthProvider│────▶│ Connect chat &    │
│ ()                │     │ EventSub          │
└───────────────────┘     └───────────────────┘
        │
        ▼
┌───────────────────┐
│ Notify renderer   │
│ via IPC           │
└───────────────────┘
```

---

## Module Interactions

### Dependency Graph

```
store.ts ◄─────────────────────┐
    ▲                          │
    │                          │
twurple.ts ◄── auth/index.ts ──┤
    ▲              ▲           │
    │              │           │
    │         ipc/handlers.ts ◄┤
    │              ▲           │
    │              │           │
twitch/index.ts ───┤           │
    ▲              │           │
    ├── chat.ts    │           │
    │              │           │
    └── eventsub.ts│           │
         ▲         │           │
         │         │           │
    events/bus.ts ◄┤           │
         ▲         │           │
         │         │           │
    handlers.ts ───┘           │
         ▲                     │
         │                     │
    queue.ts                   │
                               │
    db/index.ts ◄──────────────┘
         ▲
         │
    schema.ts
         │
    backup.ts
```

### Communication Patterns

| From | To | Method |
|------|----|--------|
| Renderer | Main | `window.api.*()` (IPC invoke) |
| Main | Renderer | `win.webContents.send()` (IPC send) |
| Main | Overlays | WebSocket broadcast |
| Overlays | Main | WebSocket connect |
| Twitch | Main | Twurple callbacks |
| Main modules | Main modules | Direct imports |

---

## Key Singletons

| Name | Location | Purpose |
|------|----------|---------|
| `eventBus` | `events/bus.ts` | Central event distribution |
| `eventQueue` | `events/queue.ts` | In-memory event buffer |
| `overlayServer` | `server/index.ts` | HTTP + WS server |
| `wsHandler` | `server/websocket.ts` | WebSocket client management |
| `store` | `store.ts` | Credential storage |
| `logger` | `logger.ts` | File/console logging |

---

## Security Considerations

### Current Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| Context isolation | Enabled | Secure IPC bridge |
| Sandbox | Disabled | Required for better-sqlite3 |
| Credential storage | OS-level encryption | Via electron-store |
| CORS | Open | `*` for overlay access |
| Local only | Yes | Servers bind to localhost |

### Recommendations for Production

1. **Sandbox consideration:** If possible, move SQLite to main process only
2. **CORS restriction:** Limit to specific origins if needed
3. **Token encryption:** Consider additional encryption layer
4. **Rate limiting:** Add to API endpoints if exposed externally
5. **Input validation:** Sanitize user inputs in overlays

---

## Future Considerations

### Potential Enhancements

1. **Settings persistence:** Currently in-memory, move to SQLite
2. **Multi-account support:** Store multiple broadcaster profiles
3. **Overlay customization UI:** Theme builder in dashboard
4. **Event replay:** Playback historical events for testing
5. **Plugin system:** User-extensible event handlers
6. **Remote access:** Optional external API access with auth

### Technical Debt

1. **Event type duplication:** `useEventSocket.ts` duplicates `event-types.ts` types
2. **API error handling:** Some endpoints could have better error responses
3. **TypeScript strictness:** Some `as unknown` casts could be improved
4. **Test coverage:** No automated tests currently

---

## Quick Reference

### Running the App

```bash
npm run dev        # Development with HMR
npm run build      # Production build
npm run build:win  # Windows installer
```

### Key Ports

| Port | Service |
|------|---------|
| 9847 | HTTP/WebSocket server |
| 9848 | OAuth callback (temporary) |

### Key Paths (Windows)

| Path | Content |
|------|---------|
| `%APPDATA%/integron-boilerplate/integron.db` | SQLite database |
| `%APPDATA%/integron-boilerplate/logs/` | Log files |
| `%APPDATA%/integron-boilerplate/backups/` | DB backups |
| `%APPDATA%/integron-boilerplate/integron-credentials.json` | Stored tokens |

---

*This document was generated during Phase 11 code review. All 11 implementation phases are complete.*
