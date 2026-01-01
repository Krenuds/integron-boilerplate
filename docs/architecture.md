# Architecture

## Overview

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

## Three-Process Model

Electron uses three separate processes:

1. **Main Process** (`src/main/index.ts`) - App lifecycle, window creation, IPC handlers
2. **Preload Script** (`src/preload/index.ts`) - Secure bridge exposing `window.electron` and `window.api` via contextBridge
3. **Renderer Process** (`src/renderer/src/`) - React application

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
