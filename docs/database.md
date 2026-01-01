# Database

The database uses Drizzle ORM with better-sqlite3. Schema is defined in `src/main/db/schema.ts`.

## Location

- **Database file**: `%APPDATA%/integron/integron.db`
- **Backups**: `%APPDATA%/integron/backups/` (auto-created on app start)

## Schema

### users

| Column            | Type     | Description             |
| ----------------- | -------- | ----------------------- |
| id                | TEXT PK  | Twitch user ID          |
| username          | TEXT     | Login name              |
| display_name      | TEXT     | Display name            |
| profile_image_url | TEXT     | Avatar URL              |
| first_seen        | DATETIME | First interaction       |
| last_seen         | DATETIME | Most recent interaction |
| message_count     | INT      | Total chat messages     |
| bits_total        | INT      | Lifetime bits           |
| sub_months        | INT      | Cumulative sub months   |
| metadata          | JSON     | Extensible data         |

### events

| Column     | Type     | Description                          |
| ---------- | -------- | ------------------------------------ |
| id         | INT PK   | Auto-increment ID                    |
| type       | TEXT     | Event type (chat, sub, follow, etc.) |
| user_id    | TEXT FK  | Reference to users.id                |
| data       | JSON     | Full event payload                   |
| created_at | DATETIME | Event timestamp                      |

Indexed on `(type, created_at)` for efficient queries.

### settings

| Column | Type    | Description        |
| ------ | ------- | ------------------ |
| key    | TEXT PK | Setting key        |
| value  | TEXT    | JSON-encoded value |

## Usage Examples

```typescript
import { getDatabase } from '../db'
import { users, events } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'

const db = getDatabase()

// Get a user by ID
const user = db.select().from(users).where(eq(users.id, '12345')).get()

// Get all users sorted by message count
const topChatters = db.select().from(users).orderBy(desc(users.messageCount)).limit(10).all()

// Get recent events
const recentEvents = db.select().from(events).orderBy(desc(events.createdAt)).limit(50).all()

// Insert a new user
db.insert(users)
  .values({
    id: '12345',
    username: 'viewer123',
    firstSeen: new Date(),
    lastSeen: new Date()
  })
  .run()

// Update user stats
db.update(users)
  .set({ messageCount: sql`${users.messageCount} + 1`, lastSeen: new Date() })
  .where(eq(users.id, '12345'))
  .run()

// Delete user (events are deleted first due to FK constraint)
db.delete(events).where(eq(events.userId, '12345')).run()
db.delete(users).where(eq(users.id, '12345')).run()
```

## Adding New Tables

1. Define the table in `src/main/db/schema.ts`:

```typescript
export const rewards = sqliteTable('rewards', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  claimedAt: integer('claimed_at', { mode: 'timestamp' })
})

export type Reward = typeof rewards.$inferSelect
export type NewReward = typeof rewards.$inferInsert
```

2. The table is auto-created on app start (Drizzle push mode in development).

3. For production migrations, see [Drizzle Kit documentation](https://orm.drizzle.team/kit-docs/overview).

## Foreign Key Constraints

The `events.user_id` column references `users.id`. When deleting a user, you must delete their events first:

```typescript
// Wrong - will throw SQLITE_CONSTRAINT_FOREIGNKEY
db.delete(users).where(eq(users.id, '12345')).run()

// Correct - delete events first
db.delete(events).where(eq(events.userId, '12345')).run()
db.delete(users).where(eq(users.id, '12345')).run()
```
