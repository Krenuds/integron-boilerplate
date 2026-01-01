# Overlays

React pages served via HTTP at `http://localhost:9847`, designed for OBS browser sources.

## Built-in Overlays

### Alerts (`/overlay/alerts.html`)

Popup notifications for subs, bits, follows, raids, etc.

| Parameter   | Default | Description                            |
| ----------- | ------- | -------------------------------------- |
| `duration`  | `5000`  | Alert display time in ms               |
| `animation` | `slide` | Animation type: `slide`, `fade`, `pop` |

```
http://localhost:9847/overlay/alerts.html?duration=3000&animation=pop
```

### Chat (`/overlay/chat.html`)

Recent chat messages with badges and user colors.

| Parameter | Default | Description            |
| --------- | ------- | ---------------------- |
| `max`     | `10`    | Max messages shown     |
| `fade`    | `30000` | Message lifetime in ms |

```
http://localhost:9847/overlay/chat.html?max=15&fade=45000
```

### Feed (`/overlay/feed.html`)

Scrolling event log (all event types).

| Parameter | Default | Description                         |
| --------- | ------- | ----------------------------------- |
| `max`     | `50`    | Max events shown                    |
| `types`   | all     | Filter: `chat,sub,follow,bits,raid` |

```
http://localhost:9847/overlay/feed.html?types=sub,follow,raid&max=100
```

## Creating New Overlays

### 1. Create the Component

```tsx
// src/overlays/src/Goals.tsx
import { useEventSocket } from './hooks/useEventSocket'
import { useEffect, useState } from 'react'

export default function Goals() {
  const { events, connected } = useEventSocket()
  const [bitGoal, setBitGoal] = useState(0)

  useEffect(() => {
    events
      .filter((e) => e.type === 'bits')
      .forEach((e) => {
        setBitGoal((prev) => prev + (e.data.bits || 0))
      })
  }, [events])

  return (
    <div className="goal-container">
      <div className="goal-bar" style={{ width: `${(bitGoal / 1000) * 100}%` }} />
      <span>
        {bitGoal} / 1000 bits
      </span>
    </div>
  )
}
```

### 2. Add HTML Entry Point

```html
<!-- src/overlays/goals.html -->
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Goals Overlay</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/goals-entry.tsx"></script>
  </body>
</html>
```

### 3. Create Entry File

```tsx
// src/overlays/src/goals-entry.tsx
import { createRoot } from 'react-dom/client'
import Goals from './Goals'

createRoot(document.getElementById('root')!).render(<Goals />)
```

### 4. Add to Vite Config

```typescript
// src/overlays/vite.config.ts
build: {
  rollupOptions: {
    input: {
      alerts: resolve(__dirname, 'alerts.html'),
      chat: resolve(__dirname, 'chat.html'),
      feed: resolve(__dirname, 'feed.html'),
      goals: resolve(__dirname, 'goals.html')  // Add this
    }
  }
}
```

### 5. Access Your Overlay

```
http://localhost:9847/overlay/goals.html
```

## WebSocket Hook

All overlays use `useEventSocket` to receive real-time events:

```typescript
const { events, connected, lastEvent } = useEventSocket({
  maxEvents: 100, // Buffer size
  types: ['sub', 'bits', 'follow'] // Filter event types (optional)
})
```

### Hook Return Values

| Property    | Type       | Description                    |
| ----------- | ---------- | ------------------------------ |
| `events`    | `Event[]`  | Array of received events       |
| `connected` | `boolean`  | WebSocket connection status    |
| `lastEvent` | `Event`    | Most recently received event   |

### Filtering Events

```typescript
// Only receive specific event types
const { events } = useEventSocket({ types: ['sub', 'bits'] })

// Or filter after receiving
const subs = events.filter((e) => e.type === 'sub')
```

## Styling Tips

- Overlays have transparent backgrounds by default
- Use CSS animations for smooth transitions
- Test with OBS browser source preview
- Consider visibility at different stream resolutions
