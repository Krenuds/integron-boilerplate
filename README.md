<p align="center">
  <img src="resources/icon.png" alt="Integron" width="128" height="128">
</p>

<h1 align="center">Integron</h1>

<p align="center">
  <strong>Twitch integration boilerplate for Electron.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-39-47848F?logo=electron&logoColor=white" alt="Electron 39">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Twurple-7.2-9146FF?logo=twitch&logoColor=white" alt="Twurple">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License">
</p>

---

## Why This Exists

Cloud overlay services limit what you can build. This runs locally, so you can do whatever you want:

- **WebGL/Three.js chat visualizations** - 3D particle systems, shader effects, physics simulations
- **GPU-accelerated animations** - No iframe sandboxing, full hardware access
- **Local file access** - Read/write files, integrate with other apps
- **Custom data pipelines** - Store everything in SQLite, build your own analytics
- **Zero latency** - Events go straight from Twitch to your overlay, no cloud middleman

It's a boilerplate. Fork it, break it, make something weird.

## How It Works

**Two interfaces, one app:**

1. **Electron window** = Your control dashboard (settings, event log, user database)
2. **HTTP server on port 9847** = Serves overlay pages for OBS browser sources

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                    │
│                                                             │
│   Twitch API ←→ Event Bus ←→ SQLite DB                     │
│        ↓              ↓            ↓                        │
│   EventSub      WebSocket      Drizzle ORM                  │
│   + Chat        Broadcast                                   │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────────────┐
│ Electron Window │  │ http://localhost:9847   │
│   (Dashboard)   │  │   /overlay/alerts       │
│                 │  │   /overlay/chat         │
│  - Settings     │  │   /overlay/feed         │
│  - Event Log    │  │                         │
│  - Users        │  │  (OBS Browser Sources)  │
│  - Test Panel   │  │                         │
└─────────────────┘  └─────────────────────────┘
```

## Quick Start

```bash
git clone https://github.com/yourusername/integron.git
cd integron
npm install
npm run dev
```

Go to **Settings**, connect your Twitch account.

## OBS Setup

Add browser sources pointing to:

| Overlay | URL |
|---------|-----|
| Alerts | `http://localhost:9847/overlay/alerts` |
| Chat | `http://localhost:9847/overlay/chat` |
| Feed | `http://localhost:9847/overlay/feed` |

Overlays auto-connect via WebSocket and update in real-time.

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

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture](docs/architecture.md) | System design, file structure |
| [Database](docs/database.md) | Schema, queries, migrations |
| [Overlays](docs/overlays.md) | Building custom overlays |
| [IPC Channels](docs/ipc.md) | Main/renderer communication |
| [WebSocket](docs/websocket.md) | Event protocol |
| [Twitch](docs/twitch.md) | OAuth, scopes, EventSub |
| [Configuration](docs/configuration.md) | Settings, logging |

## License

MIT
