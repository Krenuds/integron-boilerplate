# Integron

Electron boilerplate for Twitch integrations. Provides OAuth, EventSub, SQLite persistence, and WebSocket-powered overlays for OBS.

## Quick Start

```bash
npm install
npm run dev
```

The Electron window is your **dashboard**. The HTTP server (port 9847) serves **overlay pages** for OBS browser sources.

## Overlays

Three starter overlays are included. Add them as OBS browser sources:

### Alerts (`http://localhost:9847/overlay/alerts.html`)

Popup notifications for subs, bits, follows, raids, etc.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | `5000` | Alert display time in ms |
| `animation` | `slide` | Animation type: `slide`, `fade`, `pop` |

```
http://localhost:9847/overlay/alerts.html?duration=3000&animation=pop
```

### Chat (`http://localhost:9847/overlay/chat.html`)

Recent chat messages with badges and user colors.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max` | `10` | Max messages shown |
| `fade` | `30000` | Message lifetime in ms |

```
http://localhost:9847/overlay/chat.html?max=15&fade=45000
```

### Feed (`http://localhost:9847/overlay/feed.html`)

Scrolling event log (all event types).

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max` | `50` | Max events shown |
| `types` | all | Filter: `chat,sub,follow,bits,raid,...` |

```
http://localhost:9847/overlay/feed.html?types=sub,follow,raid&max=100
```

### Customizing Overlays

Overlays are in `src/overlays/src/`. Each is a standalone React component:

- `Alerts.tsx` - Alert popup system
- `Chat.tsx` - Chat message display
- `Feed.tsx` - Event feed/log
- `hooks/useEventSocket.ts` - WebSocket connection hook

To customize: edit the component styles inline, or create new overlays following the same pattern.

Build overlays separately: `npm run build:overlays`

## Architecture

```
Electron App (Dashboard)
    │
    ├── Twurple (OAuth, EventSub, Chat)
    ├── SQLite (users, events, settings)
    ├── HTTP Server (:9847) ──► Overlay HTML/JS
    └── WebSocket (:9847) ────► Real-time events to overlays
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development with hot reload |
| `npm run build` | Production build |
| `npm run build:win` | Windows installer |
| `npm run build:mac` | macOS DMG |
| `npm run build:linux` | Linux packages |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## IDE Setup

[VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
