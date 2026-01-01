# Integron Boilerplate - Session Handoff

## Project Overview

**Integron** is an Electron desktop app boilerplate for Twitch integrations, featuring:
- Twitch OAuth with automatic token refresh (Twurple)
- Real-time EventSub + Chat listening
- SQLite database (better-sqlite3 + Drizzle ORM)
- React 19 + Chakra UI dashboard
- HTTP/WebSocket server for OBS overlays (planned)

## Current Status: Phase 8 Complete

| Phase | Status | Description |
|-------|--------|-------------|
| 1-7 | ✅ Complete | Dependencies, DB, Auth, IPC, UI Framework, Settings, Twurple Events |
| 8 | ✅ Complete | Dashboard Pages (Dashboard, Events, TestPanel, Users) |
| 9 | 🔲 Not Started | HTTP Server & WebSocket for overlays |
| 10-11 | 🔲 Not Started | Overlay Pages, System Tray & Logging |

## Architecture

```
src/
├── main/                    # Electron main process
│   ├── index.ts            # App entry, window creation
│   ├── store.ts            # electron-store for tokens
│   ├── auth/               # Twitch OAuth (twurple.ts, index.ts)
│   ├── db/                 # SQLite + Drizzle (schema.ts, index.ts, backup.ts)
│   ├── events/             # Event system (bus.ts, handlers.ts, queue.ts)
│   ├── ipc/                # IPC handlers (handlers.ts)
│   └── twitch/             # Chat + EventSub clients (chat.ts, eventsub.ts)
├── preload/                # Secure IPC bridge
│   └── index.ts            # Exposes window.api
├── renderer/src/           # React dashboard
│   ├── App.tsx             # Router setup
│   ├── main.tsx            # Entry with providers
│   ├── contexts/           # AuthContext, EventContext
│   ├── pages/              # Dashboard, Events, TestPanel, Users, Settings
│   └── components/         # Layout, Sidebar
└── shared/                 # Shared types
    ├── event-types.ts      # TwitchEvent, EventType
    └── ipc-types.ts        # IPC channel types
```

## Key Files to Know

| File | Purpose |
|------|---------|
| [src/renderer/src/contexts/EventContext.tsx](src/renderer/src/contexts/EventContext.tsx) | React context for events & Twitch status, listens to `event:new` IPC |
| [src/renderer/src/contexts/AuthContext.tsx](src/renderer/src/contexts/AuthContext.tsx) | Auth state, login/logout, token management |
| [src/main/events/handlers.ts](src/main/events/handlers.ts) | Processes all Twitch events, broadcasts to renderer |
| [src/main/twitch/chat.ts](src/main/twitch/chat.ts) | Twurple chat client, emits chat events |
| [src/main/twitch/eventsub.ts](src/main/twitch/eventsub.ts) | EventSub WebSocket subscriptions |
| [src/preload/index.ts](src/preload/index.ts) | IPC bridge exposing `window.api` |
| [src/shared/event-types.ts](src/shared/event-types.ts) | TwitchEvent type definitions |
| [src/shared/ipc-types.ts](src/shared/ipc-types.ts) | IPC channel & payload types |

## Recent Session Work (Phase 8)

### What Was Implemented
1. **EventContext.tsx** - Created new context providing:
   - `events[]` - In-memory event queue (max 100)
   - `twitchStatus` - Chat/EventSub/Auth connection states
   - `fireTestEvent()` - Trigger test events from UI
   - Real-time event listener via `window.api.onEvent()`

2. **Dashboard.tsx** - Wired up with:
   - Connection status badges (Chat/EventSub/Auth)
   - User count from DB
   - Events today counter
   - Recent events preview (last 5)

3. **TestPanel.tsx** - 8 event fire buttons with:
   - Visual loading states
   - Custom JSON payload editor
   - Live event preview

4. **Events.tsx** - Full event log with:
   - 15 event type filters (checkboxes)
   - Search by username/content
   - Color-coded badges
   - Sortable table

5. **Users.tsx** - User management with:
   - Paginated table (20/page)
   - Sortable columns (lastSeen, messageCount, bitsTotal, subMonths)
   - Delete functionality
   - Avatar display

### Debug Logging Added
Added console logging to trace event flow:
- `[Chat] Message from {user} in #{channel}` - in chat.ts
- `[Handler] Processing {type} event from {displayName}` - in handlers.ts
- `[Handler] Queue size: {n}` - in handlers.ts
- `[Handler] Broadcast complete` - in handlers.ts

## Known Issues / Bugs to Address

### 1. TypeScript Config Warning
```
Cannot write file 'c:/Users/donth/Coding/integron-boilerplate/src/preload/index.d.ts' because it would overwrite input file.
```
- Location: `tsconfig.web.json`
- Impact: Warning only, doesn't block builds
- Fix: May need to adjust `declaration` or `outDir` settings

### 2. Real Events Not Showing (RESOLVED)
- **Cause**: User was authenticated on wrong Twitch account
- **Fix**: Re-authenticate with correct channel account
- **Verify**: Check terminal for `Chat connected to #correctchannel`

### 3. Potential UI Bugs to Investigate
Since user mentioned "small bugs in the UI and electron renderer", look for:
- Event list not updating in real-time
- Status badges not reflecting true connection state
- Pagination issues on Users page
- Filter state not persisting
- Styling inconsistencies

## Commands

```bash
npm run dev          # Start dev server with hot reload
npm run typecheck    # TypeScript checks (all 3 configs)
npm run build        # Production build
npm run lint         # ESLint
```

## Event Flow (for debugging)

```
Twitch API
    │
    ▼
chat.ts / eventsub.ts
    │ calls handleTwitchEvent()
    ▼
handlers.ts
    │ 1. upsertUser() - DB
    │ 2. updateUserStats() - DB  
    │ 3. eventQueue.push() - Memory
    │ 4. eventBus.emitEvent() - Internal
    │ 5. broadcastToRenderer() - IPC 'event:new'
    ▼
preload/index.ts
    │ window.api.onEvent()
    ▼
EventContext.tsx
    │ setEvents([newEvent, ...prev])
    ▼
Dashboard/Events/TestPanel pages
    │ useEvents() hook
    ▼
UI renders
```

## Next Session Focus: UI Bugs

Suggested investigation approach:
1. Run `npm run dev` and open DevTools (Ctrl+Shift+I)
2. Check Console for errors/warnings
3. Test each page systematically:
   - Dashboard: Do stats update? Recent events show?
   - Events: Does filtering work? Search?
   - TestPanel: Do test events appear immediately?
   - Users: Pagination? Sorting? Delete?
4. Check Network tab for failed IPC calls
5. Verify `window.api` methods are all working

## Git Status

Last commit: `e760993 feat: Phase 8 - Dashboard Pages`

Branch: `master`

## Environment

- Windows OS
- Node.js (check version with `node -v`)
- Electron 39 + electron-vite
- React 19 + Chakra UI v3
- TypeScript strict mode
