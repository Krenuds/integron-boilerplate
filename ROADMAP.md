# Integron Implementation Roadmap

## Phase Overview

| Phase | Focus                      | Dependencies   |
| ----- | -------------------------- | -------------- |
| 1     | Dependencies & Build Setup | None           |
| 2     | Database Layer             | Phase 1        |
| 3     | Authentication System      | Phases 1, 2    |
| 4     | Typed IPC Layer            | Phase 1        |
| 5     | UI Framework Setup         | Phase 1        |
| 6     | Settings Page              | Phases 3, 4, 5 |
| 7     | Twurple Event System       | Phases 3, 6    |
| 8     | Dashboard Pages            | Phases 4, 5, 7 |
| 9     | HTTP Server & WebSocket    | Phases 2, 7    |
| 10    | Overlay Pages              | Phase 9        |
| 11    | System Tray & Logging      | Phase 9        |

> **Note:** Phases 8 and 9 were swapped from the original plan. Dashboard pages come first
> to provide immediate visual feedback and a working Test Panel for development.

---

## Phase 1: Dependencies & Build Setup

**Goal**: Install all required packages and configure Vite for the new stack.

### Tasks

1. Install production dependencies:

   ```
   @chakra-ui/react @emotion/react @emotion/styled framer-motion
   react-router-dom
   better-sqlite3 drizzle-orm
   @twurple/auth @twurple/api @twurple/chat @twurple/eventsub-ws
   electron-store electron-log
   express ws
   ```

2. Install dev dependencies:

   ```
   drizzle-kit
   @types/better-sqlite3 @types/express @types/ws
   ```

3. Update `electron.vite.config.ts`:
   - Configure external modules for better-sqlite3
   - Add overlay build configuration

4. Update `tsconfig.node.json`:
   - Add better-sqlite3 types

### Files Modified

- `package.json`
- `electron.vite.config.ts`
- `tsconfig.node.json`

### Verification

- `npm install` completes without errors
- `npm run dev` starts successfully

---

## Phase 2: Database Layer

**Goal**: Set up SQLite database with Drizzle ORM and backup system.

### Tasks

1. Create Drizzle schema (`src/main/db/schema.ts`):
   - `users` table
   - `events` table
   - `settings` table

2. Create database connection (`src/main/db/index.ts`):
   - Initialize better-sqlite3
   - Configure Drizzle
   - Run migrations on startup

3. Create backup utility (`src/main/db/backup.ts`):
   - Copy database file to `backups/` on startup
   - Keep last 5 backups

4. Configure drizzle-kit for migrations

### Files Created

- `src/main/db/schema.ts`
- `src/main/db/index.ts`
- `src/main/db/backup.ts`
- `drizzle.config.ts`

### Verification

- Database file created in app data directory
- Tables created successfully
- Backup created on startup

---

## Phase 3: Authentication System

**Goal**: Implement Twitch OAuth flow with secure token storage.

### Tasks

1. Create electron-store wrapper (`src/main/store.ts`):
   - Typed store for credentials
   - Methods: get, set, clear credentials

2. Create auth manager (`src/main/auth/index.ts`):
   - Start OAuth flow (open browser)
   - Handle callback
   - Exchange code for tokens
   - Store tokens

3. Create Twurple auth provider (`src/main/auth/twurple.ts`):
   - RefreshingAuthProvider setup
   - Token persistence callbacks
   - Auto-refresh handling

4. Add callback route to main process:
   - Temporary HTTP server for OAuth callback
   - Parse authorization code
   - Complete token exchange

### Files Created

- `src/main/store.ts`
- `src/main/auth/index.ts`
- `src/main/auth/twurple.ts`

### Verification

- Can open Twitch auth page
- Callback received and processed
- Tokens stored and retrievable
- Token refresh works

---

## Phase 4: Typed IPC Layer

**Goal**: Create end-to-end typed IPC communication.

### Tasks

1. Define shared types (`src/shared/ipc-types.ts`):
   - Channel names as const
   - Request/response types for each channel

2. Define event types (`src/shared/event-types.ts`):
   - TwitchEvent union type
   - Individual event interfaces

3. Update preload (`src/preload/index.ts`):
   - Expose typed API methods
   - Wrap ipcRenderer.invoke

4. Update preload types (`src/preload/index.d.ts`):
   - Type window.api properly

5. Create IPC handlers (`src/main/ipc/handlers.ts`):
   - Register all handlers
   - Connect to auth, db, events

### Files Created

- `src/shared/ipc-types.ts`
- `src/shared/event-types.ts`
- `src/main/ipc/handlers.ts`

### Files Modified

- `src/preload/index.ts`
- `src/preload/index.d.ts`

### Verification

- TypeScript catches type mismatches
- IPC calls work from renderer

---

## Phase 5: UI Framework Setup

**Goal**: Configure Chakra UI and React Router.

### Tasks

1. Create Chakra theme (`src/renderer/src/theme.ts`):
   - Dark mode only config
   - Minimal color palette
   - Compact component sizing

2. Update entry point (`src/renderer/src/main.tsx`):
   - Add ChakraProvider
   - Add BrowserRouter

3. Create app shell (`src/renderer/src/App.tsx`):
   - Router with routes
   - Layout component with sidebar

4. Create layout components:
   - `src/renderer/src/components/Layout.tsx`
   - `src/renderer/src/components/Sidebar.tsx`

5. Create placeholder pages:
   - Dashboard, Settings, Events, Users, TestPanel

### Files Created

- `src/renderer/src/theme.ts`
- `src/renderer/src/components/Layout.tsx`
- `src/renderer/src/components/Sidebar.tsx`
- `src/renderer/src/pages/Dashboard.tsx`
- `src/renderer/src/pages/Settings.tsx`
- `src/renderer/src/pages/Events.tsx`
- `src/renderer/src/pages/Users.tsx`
- `src/renderer/src/pages/TestPanel.tsx`

### Files Modified

- `src/renderer/src/main.tsx`
- `src/renderer/src/App.tsx`

### Verification

- App renders with dark theme
- Navigation between pages works
- Layout displays correctly

---

## Phase 6: Settings Page

**Goal**: Build functional OAuth configuration UI.

### Tasks

1. Create auth context (`src/renderer/src/contexts/AuthContext.tsx`):
   - Auth status state
   - Login/logout methods
   - Credential management

2. Build Settings page UI:
   - Client ID / Secret input fields
   - Save credentials button
   - Connect to Twitch button
   - Disconnect button
   - Connection status display

3. Wire up IPC calls:
   - Save credentials
   - Start OAuth flow
   - Get auth status
   - Logout

### Files Created

- `src/renderer/src/contexts/AuthContext.tsx`

### Files Modified

- `src/renderer/src/pages/Settings.tsx`

### Verification

- Can enter and save credentials
- Can initiate OAuth flow
- Shows connected/disconnected status
- Can disconnect

---

## Phase 7: Twurple Event System

**Goal**: Connect to Twitch and listen for all events.

### Tasks

1. Create Twitch client manager (`src/main/twitch/index.ts`):
   - Initialize API client
   - Connection state management

2. Create chat client (`src/main/twitch/chat.ts`):
   - Connect to channel chat
   - Handle chat messages

3. Create EventSub listener (`src/main/twitch/eventsub.ts`):
   - WebSocket connection
   - Subscribe to all required events
   - Handle incoming events

4. Create event bus (`src/main/events/bus.ts`):
   - EventEmitter for internal events
   - Typed event emission

5. Create event handlers (`src/main/events/handlers.ts`):
   - Process each event type
   - Update database (user data)
   - Emit to event bus

6. Create event queue (`src/main/events/queue.ts`):
   - Buffer events to prevent overflow
   - Configurable max size

### Files Created

- `src/main/twitch/index.ts`
- `src/main/twitch/chat.ts`
- `src/main/twitch/eventsub.ts`
- `src/main/events/bus.ts`
- `src/main/events/handlers.ts`
- `src/main/events/queue.ts`

### Verification

- Connects to Twitch on auth
- Receives chat messages
- Receives EventSub events
- Events stored in database

---

## Phase 8: Dashboard Pages

**Goal**: Complete all dashboard page functionality with visual feedback.

### Tasks

1. Create event context (`src/renderer/src/contexts/EventContext.tsx`):
   - Live event subscription via IPC
   - Recent events state
   - Real-time updates from main process

2. Build Dashboard page:
   - Connection status cards (Twitch, Chat, EventSub)
   - Stats display (users, events today)
   - Recent event preview

3. Build Event Log page:
   - Real-time event list
   - Type filter checkboxes
   - Username search
   - Timestamps

4. Build Users page:
   - Paginated user table
   - Sort controls
   - User detail modal
   - Delete functionality

5. Build Test Panel page:
   - Event type buttons (wired to IPC)
   - JSON payload editor
   - Fire event button
   - Visual confirmation of fired events

### Files Created

- `src/renderer/src/contexts/EventContext.tsx`

### Files Modified

- `src/renderer/src/pages/Dashboard.tsx`
- `src/renderer/src/pages/Events.tsx`
- `src/renderer/src/pages/Users.tsx`
- `src/renderer/src/pages/TestPanel.tsx`

### Verification

- Dashboard shows live Twitch connection status
- Event log updates in real-time
- Users table is functional
- Test events fire and appear in event log

---

## Phase 9: HTTP Server & WebSocket

**Goal**: Serve overlays and broadcast events in real-time.

### Tasks

1. Create Express server (`src/main/server/index.ts`):
   - Start on port 9847
   - Integrate WebSocket upgrade

2. Create API routes (`src/main/server/routes.ts`):
   - `GET /api/events` - recent events
   - `GET /api/users` - user list

3. Create WebSocket handler (`src/main/server/websocket.ts`):
   - Track connected clients
   - Broadcast events to all clients
   - Handle reconnection

4. Configure overlay serving:
   - Serve static files from overlay build
   - Route `/overlay/*` to overlay pages

5. Connect event bus to WebSocket:
   - Subscribe to event bus
   - Broadcast each event

### Files Created

- `src/main/server/index.ts`
- `src/main/server/routes.ts`
- `src/main/server/websocket.ts`

### Verification

- Server starts on port 9847
- API endpoints return data
- WebSocket accepts connections
- Events broadcast to clients

---

## Phase 10: Overlay Pages

**Goal**: Build three example overlays for OBS.

### Tasks

1. Set up overlay build system:
   - Create `src/overlays/` directory
   - Configure Vite for overlay build
   - Set up build output to `out/overlays/`

2. Create WebSocket hook (`src/overlays/src/hooks/useEventSocket.ts`):
   - Connect to ws://localhost:9847
   - Auto-reconnect
   - Parse incoming events

3. Build Event Feed overlay (`src/overlays/src/Feed.tsx`):
   - Scrolling event list
   - Event type icons
   - URL param configuration

4. Build Alert Box overlay (`src/overlays/src/Alerts.tsx`):
   - Popup notifications
   - Animation system
   - Event queue

5. Build Chat overlay (`src/overlays/src/Chat.tsx`):
   - Message display
   - Username colors
   - Fade out effect

6. Add overlay build to main build process

### Files Created

- `src/overlays/vite.config.ts`
- `src/overlays/package.json`
- `src/overlays/index.html`
- `src/overlays/src/main.tsx`
- `src/overlays/src/hooks/useEventSocket.ts`
- `src/overlays/src/Feed.tsx`
- `src/overlays/src/Alerts.tsx`
- `src/overlays/src/Chat.tsx`

### Verification

- Overlays build successfully
- Server serves overlay pages
- WebSocket connection works
- Events display in overlays
- OBS can load overlay URLs

---

## Phase 11: System Tray & Logging

**Goal**: Add polish features - tray icon and logging.

### Tasks

1. Create logger (`src/main/logger.ts`):
   - Configure electron-log
   - Debug level default
   - 3 file rotation
   - Log to app data directory

2. Add logging throughout:
   - Auth events
   - Connection status
   - Errors
   - Event processing

3. Create system tray (`src/main/index.ts`):
   - Tray icon
   - Context menu:
     - Show/Hide window
     - Connection status
     - Overlay URLs submenu
     - Quit

4. Implement minimize to tray:
   - Intercept close event
   - Hide window instead
   - Show from tray

### Files Created

- `src/main/logger.ts`

### Files Modified

- `src/main/index.ts`
- Various files (add logging)

### Verification

- Logs written to files
- Log rotation works
- Tray icon appears
- Tray menu functional
- Minimize to tray works

---

## Completion Checklist

- [x] Phase 1: Dependencies installed, build configured
- [x] Phase 2: Database operational with backups
- [x] Phase 3: OAuth flow complete, tokens persisted
- [x] Phase 4: Typed IPC working
- [x] Phase 5: Chakra UI + Router set up
- [x] Phase 6: Settings page functional
- [x] Phase 7: Twurple receiving events
- [x] Phase 8: All dashboard pages complete
- [x] Phase 9: HTTP + WebSocket server running
- [ ] Phase 10: All overlay pages working
- [ ] Phase 11: Tray and logging implemented

---

## Quick Start After Implementation

1. Run `npm run dev`
2. Go to Settings page
3. Enter Twitch Client ID and Secret
4. Click "Connect to Twitch"
5. Authorize in browser
6. Open OBS, add Browser Source: `http://localhost:9847/overlay/alerts`
7. Use Test Panel to fire test events
8. See alerts appear in OBS
