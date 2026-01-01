# IPC Channels

Typed end-to-end communication between renderer and main process.

## Available Channels

### Auth

| Channel                 | Returns                      | Description             |
| ----------------------- | ---------------------------- | ----------------------- |
| `auth:get-status`       | `{ authenticated, channel }` | Check auth state        |
| `auth:start-login`      | `void`                       | Opens browser for OAuth |
| `auth:logout`           | `void`                       | Clears tokens           |
| `auth:save-credentials` | `void`                       | Stores client ID/secret |

### Events

| Channel             | Returns   | Description            |
| ------------------- | --------- | ---------------------- |
| `events:get-recent` | `Event[]` | Get recent events      |
| `events:test-fire`  | `void`    | Simulates an event     |
| `events:subscribe`  | `void`    | Start receiving events |

### Users

| Channel           | Returns          | Description             |
| ----------------- | ---------------- | ----------------------- |
| `users:get-all`   | `UserListResult` | Paginated user list     |
| `users:get-by-id` | `User`           | Single user by ID       |
| `users:delete`    | `void`           | Removes user and events |

### Server

| Channel             | Returns                          | Description     |
| ------------------- | -------------------------------- | --------------- |
| `server:get-status` | `{ running, port, connections }` | Server status   |
| `server:restart`    | `void`                           | Restart HTTP/WS |

### Settings

| Channel           | Returns    | Description      |
| ----------------- | ---------- | ---------------- |
| `settings:get`    | `Settings` | Get all settings |
| `settings:update` | `void`     | Update settings  |

## Adding New IPC Channels

### 1. Define Types

```typescript
// src/shared/ipc-types.ts
export interface RewardData {
  userId: string
  type: string
  amount: number
}

export interface Reward {
  id: string
  userId: string
  type: string
  amount: number
  claimedAt: Date
}
```

### 2. Add Handler

```typescript
// src/main/ipc/handlers.ts
import { rewards } from '../db/schema'

ipcMain.handle('rewards:create', (_event, data: RewardData): Reward => {
  const db = getDatabase()
  const reward = {
    id: crypto.randomUUID(),
    ...data,
    claimedAt: new Date()
  }
  db.insert(rewards).values(reward).run()
  return reward
})

ipcMain.handle('rewards:get-user', (_event, userId: string): Reward[] => {
  const db = getDatabase()
  return db.select().from(rewards).where(eq(rewards.userId, userId)).all()
})
```

### 3. Expose in Preload

```typescript
// src/preload/index.ts
const api = {
  // ... existing methods
  createReward: (data: RewardData) => ipcRenderer.invoke('rewards:create', data),
  getUserRewards: (userId: string) => ipcRenderer.invoke('rewards:get-user', userId)
}
```

### 4. Add Type Definitions

```typescript
// src/preload/index.d.ts
interface Api {
  // ... existing methods
  createReward(data: RewardData): Promise<Reward>
  getUserRewards(userId: string): Promise<Reward[]>
}
```

### 5. Use in Renderer

```typescript
// In any React component
const reward = await window.api.createReward({
  userId: '12345',
  type: 'daily_bonus',
  amount: 100
})

const userRewards = await window.api.getUserRewards('12345')
```

## IPC Pattern

The IPC communication follows this pattern:

```
Renderer                    Main
   │                          │
   │  invoke('channel', data) │
   │ ─────────────────────────>
   │                          │  handler processes
   │                          │
   │        result            │
   < ─────────────────────────
   │                          │
```

- **Main listens**: `ipcMain.handle('channel', handler)`
- **Renderer sends**: `window.api.methodName(args)` (via preload)
- All communication is async (returns Promises)
