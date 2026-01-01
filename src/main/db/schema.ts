import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  displayName: text('display_name'),
  profileImageUrl: text('profile_image_url'),
  firstSeen: integer('first_seen', { mode: 'timestamp' }).notNull(),
  lastSeen: integer('last_seen', { mode: 'timestamp' }).notNull(),
  messageCount: integer('message_count').notNull().default(0),
  bitsTotal: integer('bits_total').notNull().default(0),
  subMonths: integer('sub_months').notNull().default(0),
  metadata: text('metadata', { mode: 'json' })
})

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(),
    userId: text('user_id').references(() => users.id),
    data: text('data', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [index('events_type_created_idx').on(table.type, table.createdAt)]
)

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value')
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Setting = typeof settings.$inferSelect
