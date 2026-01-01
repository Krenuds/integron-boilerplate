# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron desktop application boilerplate using React 19, TypeScript, and electron-vite.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (runs typecheck first) |
| `npm run build:win` | Build Windows installer |
| `npm run build:mac` | Build macOS DMG |
| `npm run build:linux` | Build Linux packages |
| `npm run typecheck` | Run all TypeScript checks |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Architecture

Three-process Electron architecture:

1. **Main Process** (`src/main/index.ts`) - App lifecycle, window creation, IPC handlers
2. **Preload Script** (`src/preload/index.ts`) - Secure bridge exposing `window.electron` and `window.api` via contextBridge
3. **Renderer Process** (`src/renderer/src/`) - React application

**IPC Pattern:**
- Main listens: `ipcMain.on('channel', handler)`
- Renderer sends: `window.electron.ipcRenderer.send('channel')`

# Integron Technical Specification

## Overview

Integron is an Electron desktop application boilerplate for building Twitch integrations. It provides:

- Twitch OAuth authentication with automatic token refresh
- Real-time event listening via Twurple/EventSub WebSocket
- SQLite database for user and event tracking
- Local HTTP server serving React-based overlays for OBS
- WebSocket broadcasting for real-time overlay updates

The Electron window is the **configuration dashboard**. The HTTP server serves **overlay pages** for OBS browser sources.

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

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Electron 39 + electron-vite | Desktop app framework |
| UI Library | Chakra UI | Component library (dark theme only) |
| State | React Context | State management |
| Routing | React Router v7 | Page navigation |
| Twitch API | Twurple (all packages) | OAuth, API, Chat, EventSub |
| Database | better-sqlite3 + Drizzle ORM | Local data persistence |
| HTTP Server | Express.js | Serve overlays and API |
| WebSocket | ws | Real-time overlay updates |
| Token Storage | electron-store | Secure credential storage |
| Logging | electron-log | File-based logging (3 file rotation) |

---

## Twitch Integration

### OAuth Scopes

All available broadcaster scopes will be requested:

- `chat:read`, `chat:edit` - Chat access
- `channel:read:subscriptions` - Subscriber data
- `channel:read:redemptions` - Channel points
- `bits:read` - Bits/cheers
- `moderator:read:followers` - Follower events
- `channel:read:hype_train` - Hype trains
- `channel:read:polls` - Poll events
- `channel:read:predictions` - Prediction events
- Additional scopes as needed

### Events Listened

| Event | Source | Persisted |
|-------|--------|-----------|
| Chat messages | Chat client | User data only |
| Subscriptions (new, resub, gift) | EventSub | Yes |
| Channel point redemptions | EventSub | Yes |
| Follows | EventSub | Yes |
| Bits/Cheers | EventSub | Yes |
| Raids | EventSub | Yes |
| Hype trains | EventSub | Yes |
| Polls | EventSub | No |
| Predictions | EventSub | No |
| Shoutouts | EventSub | No |

### Token Management

- Tokens stored in electron-store (encrypted at OS level)
- Automatic silent refresh using Twurple's RefreshingAuthProvider
- Refresh tokens persisted for "remember me" functionality
- Single broadcaster account supported

---

## Database Schema

### users

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | Twitch user ID |
| username | TEXT | Login name |
| display_name | TEXT | Display name |
| profile_image_url | TEXT | Avatar URL |
| first_seen | DATETIME | First interaction |
| last_seen | DATETIME | Most recent interaction |
| message_count | INT | Total chat messages |
| bits_total | INT | Lifetime bits |
| sub_months | INT | Cumulative sub months |
| metadata | JSON | Extensible data |

### events

| Column | Type | Description |
|--------|------|-------------|
| id | INT PK | Auto-increment ID |
| type | TEXT | Event type (chat, sub, follow, etc.) |
| user_id | TEXT FK | Reference to users.id |
| data | JSON | Full event payload |
| created_at | DATETIME | Event timestamp |

Indexed on `(type, created_at)` for efficient queries.

### settings

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT PK | Setting key |
| value | TEXT | JSON-encoded value |

### Backups

Database automatically backed up to `backups/` folder on app start.

---

## HTTP Server & WebSocket

### Port

**9847** - Both HTTP and WebSocket (HTTP upgrade)

### HTTP Endpoints

| Route | Purpose |
|-------|---------|
| `/overlay/*` | Serve built overlay React pages |
| `/api/events` | REST: Get recent events |
| `/api/users` | REST: Get user data |
| `/auth/callback` | OAuth callback handler |

### WebSocket Protocol

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

---

## Electron Dashboard Pages

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

## Overlay Pages

React pages served via HTTP, designed for OBS browser sources.

### Event Feed (`/overlay/feed`)
- Scrolling list of all events
- Max 50 items, auto-scroll
- Event type icons
- URL params: `?max=50&types=chat,sub`

### Alert Box (`/overlay/alerts`)
- Popup notifications for events
- Animated entrance/exit
- Queue system for multiple alerts
- URL params: `?duration=5000&animation=slide`

### Chat Overlay (`/overlay/chat`)
- Recent chat messages
- Username colors and badges
- Fade out old messages
- URL params: `?max=10&fade=30000`

All overlays:
- Connect to WebSocket automatically
- Reconnect on disconnect
- Minimal styling (designed for customization)

---

## IPC Channels

Typed end-to-end communication between renderer and main process.

### Auth
- `auth:get-status` - Returns `{ authenticated, channel }`
- `auth:start-login` - Opens browser for OAuth
- `auth:logout` - Clears tokens
- `auth:save-credentials` - Stores client ID/secret

### Events
- `events:get-recent` - Returns `Event[]`
- `events:test-fire` - Simulates an event
- `events:subscribe` - Start receiving live events

### Users
- `users:get-all` - Returns paginated `User[]`
- `users:get-by-id` - Returns single `User`
- `users:delete` - Removes user record

### Server
- `server:get-status` - Returns `{ running, port, connections }`
- `server:restart` - Restart HTTP/WS server

### Settings
- `settings:get` - Returns all settings
- `settings:update` - Updates settings

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

## Session Start Protocol

**At the START of every session:**

1. Run `git status` and `git log --oneline -5` to understand current state
2. Review any uncommitted changes from previous sessions
3. Commit or stash any dangling work before starting new tasks

## Git Commit Requirements

**CRITICAL REQUIREMENT - You MUST follow this:**

When you complete ANY task (bug fix, feature addition, refactoring, configuration, documentation):

1. **Review changes** with `git status` and `git diff`
2. **Create a detailed commit message** that includes:
   - **Summary line**: Conventional commit format (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
   - **What changed**: Specific files, functions, or components modified
   - **Why it changed**: Purpose, context, problem being solved
3. **Commit immediately** after task completion
4. **Do NOT batch multiple unrelated tasks** - commit after EACH completed task

**Commit Message Format:**

```
<type>: <short summary in imperative mood>

- Detailed point about what changed
- Why this change was needed
- Technical context if relevant

Files modified: <paths>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Commit Types:**

- `feat:` - New feature or functionality
- `fix:` - Bug fix
- `refactor:` - Code restructuring without behavior change
- `docs:` - Documentation changes
- `chore:` - Configuration, dependencies, tooling

**This is NOT optional - commit after EVERY completed task.**

## NEXT STEPS

- **REVIEW GIT HISTORY**: Last 4 commits, read them now
- **Tell the user**: Echo "READY AND CAUGHT UP" to the user
