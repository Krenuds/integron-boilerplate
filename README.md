# Integron

Electron boilerplate for Twitch integrations. Provides OAuth, EventSub, SQLite persistence, and WebSocket-powered overlays for OBS.

## Quick Start

```bash
npm install
npm run dev
```

The Electron window is your **dashboard**. The HTTP server (port 9847) serves **overlay pages** for OBS browser sources.

## Documentation

| Guide | Description |
| ----- | ----------- |
| [Architecture](docs/architecture.md) | System diagram, tech stack, file structure |
| [Database](docs/database.md) | Schema, Drizzle ORM usage, adding tables |
| [Overlays](docs/overlays.md) | Built-in overlays, creating new ones |
| [IPC Channels](docs/ipc.md) | Available channels, adding new ones |
| [WebSocket](docs/websocket.md) | Protocol, event types, custom events |
| [Twitch](docs/twitch.md) | OAuth, EventSub, adding scopes |
| [Configuration](docs/configuration.md) | Dashboard, logging, security, code style |

## Overlays for OBS

Add these as browser sources:

| Overlay | URL | Purpose |
| ------- | --- | ------- |
| Alerts | `http://localhost:9847/overlay/alerts.html` | Popup notifications |
| Chat | `http://localhost:9847/overlay/chat.html` | Chat messages |
| Feed | `http://localhost:9847/overlay/feed.html` | Event log |

See [Overlays documentation](docs/overlays.md) for parameters and customization.

## Commands

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Development with hot reload |
| `npm run build` | Production build |
| `npm run build:win` | Windows installer |
| `npm run build:mac` | macOS DMG |
| `npm run build:linux` | Linux packages |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Tech Stack

- **Electron 39** + electron-vite
- **React 19** + Chakra UI
- **Twurple** (OAuth, EventSub, Chat)
- **SQLite** (better-sqlite3 + Drizzle ORM)
- **Express** + **ws** (HTTP server + WebSocket)

## License

MIT
