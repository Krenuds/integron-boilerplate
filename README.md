<p align="center">
  <img src="resources/icon.png" alt="Integron" width="128" height="128">
</p>

<h1 align="center">Integron</h1>

<p align="center">
  <strong>The Twitch integration boilerplate you've been looking for.</strong>
</p>

<p align="center">
  Build stream overlays, alerts, and chat integrations without wrestling with Twitch's API complexity.
</p>

---

## What is this?

Integron is a ready-to-customize Electron desktop app that handles all the boring infrastructure so you can focus on creating unique stream experiences. It connects to Twitch, listens to events, stores data, and broadcasts to your overlays in real-time.

**The Electron window is your control dashboard. The HTTP server powers your OBS browser sources.**

## What you get

- **Twitch OAuth** - One-click authentication with automatic token refresh
- **Real-time events** - Follows, subs, bits, raids, channel points, hype trains via EventSub
- **Chat integration** - Full chat access with badges and emotes
- **SQLite database** - Persistent user and event tracking with Drizzle ORM
- **WebSocket server** - Push events to any connected overlay instantly
- **Ready-made overlays** - Alerts, chat, and event feed templates
- **System tray** - Minimize to tray, quick overlay links, status indicators

## Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/integron.git
cd integron
npm install

# Start development
npm run dev
```

The dashboard opens automatically. Head to **Settings** to connect your Twitch account.

## Overlays for OBS

Add these as browser sources in OBS:

| Overlay | URL | Purpose |
|---------|-----|---------|
| Alerts | `http://localhost:9847/overlay/alerts.html` | Animated popup notifications |
| Chat | `http://localhost:9847/overlay/chat.html` | Styled chat messages |
| Feed | `http://localhost:9847/overlay/feed.html` | Scrolling event log |

All overlays connect via WebSocket and update in real-time. Customize the CSS or build your own from the included templates.

## Tech Stack

| What | Why |
|------|-----|
| **Electron 39** + electron-vite | Fast builds, hot reload, native access |
| **React 19** + Chakra UI | Modern UI with dark theme |
| **Twurple** | Battle-tested Twitch library |
| **SQLite** + Drizzle ORM | Zero-config local database |
| **Express** + ws | HTTP server with WebSocket upgrade |

## Dashboard Pages

- **Dashboard** - Connection status, stats, recent events
- **Settings** - Twitch OAuth, server config
- **Event Log** - Filterable real-time event stream
- **Users** - Viewer database with engagement metrics
- **Test Panel** - Simulate events for overlay testing

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture](docs/architecture.md) | System diagram, file structure |
| [Database](docs/database.md) | Schema, queries, migrations |
| [Overlays](docs/overlays.md) | Building custom overlays |
| [IPC Channels](docs/ipc.md) | Main/renderer communication |
| [WebSocket](docs/websocket.md) | Event protocol, client examples |
| [Twitch](docs/twitch.md) | OAuth flow, scopes, EventSub |
| [Configuration](docs/configuration.md) | Settings, logging, security |

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

## Building Something?

This is a boilerplate. Fork it, rename it, make it yours. The code is intentionally minimal and well-documented so you can understand and extend it.

Some ideas:
- Custom alert animations with CSS/Framer Motion
- Loyalty points system using the user database
- Channel point redemption triggers
- Chat commands and bot responses
- Hype train visualizations
- Sub goal trackers

## License

MIT - Do whatever you want with it.
