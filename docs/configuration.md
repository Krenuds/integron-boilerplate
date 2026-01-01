# Configuration

## Dashboard Pages

The Electron window serves as the configuration dashboard.

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

## Logging

- **Level**: Debug (all) by default
- **Output**: Console + file
- **Rotation**: Keep latest 3 log files
- **Location**: `%APPDATA%/integron/logs/`

## System Tray

- Tray icon with context menu
- Show/Hide window toggle
- Connection status indicator
- Quick links to overlay URLs
- Quit option
- Minimize to tray on window close

## Security

- Context isolation enabled
- Credentials stored in electron-store (OS-level encryption)
- No additional encryption layer
- No machine binding
- No password lock feature
- Sandbox disabled for Node.js access (required for sqlite)

## TypeScript Configuration

Three separate tsconfig files:

| File                 | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `tsconfig.node.json` | Main and preload processes                                      |
| `tsconfig.web.json`  | Renderer process (includes `@renderer/*` → `src/renderer/src/*`)|
| `tsconfig.json`      | Composite root                                                  |

## Code Style

- Single quotes, no semicolons, 100 char line width
- No trailing commas
- Configured in `.prettierrc.yaml` and `eslint.config.mjs`

### Key Patterns

- Import images with `?asset` suffix for Vite handling
- Preload exposes APIs through `window.electron` (from @electron-toolkit) and `window.api` (custom)
- Context isolation enabled, sandbox disabled for Node access

## Design Guidelines

- **Theme**: Dark mode only
- **Style**: Minimal, compact, sparse
- **Focus**: Functionality over aesthetics
- **Customization**: CSS-friendly for developers to restyle
- **Boilerplate philosophy**: Clean foundation for creativity
