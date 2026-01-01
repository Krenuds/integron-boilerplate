# Twitch Integration

Integron uses [Twurple](https://twurple.js.org/) for all Twitch API interactions.

## OAuth Scopes

All available broadcaster scopes are requested:

| Scope                        | Purpose            |
| ---------------------------- | ------------------ |
| `chat:read`                  | Read chat messages |
| `chat:edit`                  | Send chat messages |
| `channel:read:subscriptions` | Subscriber data    |
| `channel:read:redemptions`   | Channel points     |
| `bits:read`                  | Bits/cheers        |
| `moderator:read:followers`   | Follower events    |
| `channel:read:hype_train`    | Hype trains        |
| `channel:read:polls`         | Poll events        |
| `channel:read:predictions`   | Prediction events  |

## Events Listened

| Event                            | Source      | Persisted      |
| -------------------------------- | ----------- | -------------- |
| Chat messages                    | Chat client | User data only |
| Subscriptions (new, resub, gift) | EventSub    | Yes            |
| Channel point redemptions        | EventSub    | Yes            |
| Follows                          | EventSub    | Yes            |
| Bits/Cheers                      | EventSub    | Yes            |
| Raids                            | EventSub    | Yes            |
| Hype trains                      | EventSub    | Yes            |
| Polls                            | EventSub    | No             |
| Predictions                      | EventSub    | No             |
| Shoutouts                        | EventSub    | No             |

## Token Management

- Tokens stored in electron-store (encrypted at OS level)
- Automatic silent refresh using Twurple's RefreshingAuthProvider
- Refresh tokens persisted for "remember me" functionality
- Single broadcaster account supported

## Adding New Scopes

### 1. Update Scope List

```typescript
// src/main/auth/index.ts
const SCOPES = [
  'chat:read',
  'chat:edit',
  // ... existing scopes
  'channel:manage:broadcast' // Add new scope
]
```

### 2. Re-authenticate

Users must disconnect and reconnect their Twitch account to grant new scopes.

### 3. Add EventSub Listener (if needed)

```typescript
// src/main/twitch/eventsub.ts
eventSubClient.onStreamOnline(userId, (event) => {
  handleTwitchEvent({
    type: 'stream_online',
    userId: event.broadcasterId,
    username: event.broadcasterName,
    startedAt: event.startDate
  })
})
```

## Setting Up Twitch App

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Set OAuth Redirect URL to `http://localhost:9847/auth/callback`
4. Copy Client ID and Client Secret to Integron settings

## EventSub WebSocket

Integron uses EventSub over WebSocket (not webhooks), which:

- Requires no public server or ngrok
- Automatically reconnects on disconnect
- Works behind firewalls/NAT

The connection is managed by Twurple's `EventSubWsListener`.
