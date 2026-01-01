import { app } from 'electron'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as schema from './schema'
import { createBackup } from './backup'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null
let sqlite: Database.Database | null = null

export function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'integron.db')
}

export function initDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (db) return db

  const dbPath = getDbPath()
  const dbDir = join(app.getPath('userData'))

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  // Create backup of existing database
  if (existsSync(dbPath)) {
    createBackup(dbPath)
  }

  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  db = drizzle(sqlite, { schema })

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      display_name TEXT,
      profile_image_url TEXT,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      message_count INTEGER NOT NULL DEFAULT 0,
      bits_total INTEGER NOT NULL DEFAULT 0,
      sub_months INTEGER NOT NULL DEFAULT 0,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      user_id TEXT REFERENCES users(id),
      data TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS events_type_created_idx ON events(type, created_at);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  return db
}

export function getDatabase(): ReturnType<typeof drizzle<typeof schema>> {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (sqlite) {
    sqlite.close()
    sqlite = null
    db = null
  }
}

export { schema }
