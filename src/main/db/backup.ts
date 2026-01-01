import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const MAX_BACKUPS = 5

export function getBackupDir(): string {
  return join(app.getPath('userData'), 'backups')
}

export function createBackup(dbPath: string): string | null {
  if (!existsSync(dbPath)) {
    return null
  }

  const backupDir = getBackupDir()

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupName = `integron-${timestamp}.db`
  const backupPath = join(backupDir, backupName)

  copyFileSync(dbPath, backupPath)

  // Also backup WAL files if they exist
  const walPath = `${dbPath}-wal`
  const shmPath = `${dbPath}-shm`

  if (existsSync(walPath)) {
    copyFileSync(walPath, `${backupPath}-wal`)
  }
  if (existsSync(shmPath)) {
    copyFileSync(shmPath, `${backupPath}-shm`)
  }

  cleanupOldBackups()

  return backupPath
}

function cleanupOldBackups(): void {
  const backupDir = getBackupDir()

  if (!existsSync(backupDir)) {
    return
  }

  const backups = readdirSync(backupDir)
    .filter((f) => f.startsWith('integron-') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      path: join(backupDir, f),
      time: extractTimestamp(f)
    }))
    .sort((a, b) => b.time - a.time)

  // Remove old backups beyond MAX_BACKUPS
  const toRemove = backups.slice(MAX_BACKUPS)

  for (const backup of toRemove) {
    unlinkSync(backup.path)

    // Also remove associated WAL/SHM files
    const walPath = `${backup.path}-wal`
    const shmPath = `${backup.path}-shm`

    if (existsSync(walPath)) unlinkSync(walPath)
    if (existsSync(shmPath)) unlinkSync(shmPath)
  }
}

function extractTimestamp(filename: string): number {
  // Format: integron-2024-01-15T12-00-00-000Z.db
  const match = filename.match(/integron-(.+)\.db$/)
  if (!match) return 0

  const isoString = match[1].replace(/-/g, (m, i) => {
    // Restore colons at positions 13, 16, and 19 (after T)
    if (i === 13 || i === 16) return ':'
    if (i === 19) return '.'
    return m
  })

  const date = new Date(isoString)
  return isNaN(date.getTime()) ? 0 : date.getTime()
}

export function listBackups(): { name: string; path: string; date: Date }[] {
  const backupDir = getBackupDir()

  if (!existsSync(backupDir)) {
    return []
  }

  return readdirSync(backupDir)
    .filter((f) => f.startsWith('integron-') && f.endsWith('.db'))
    .map((f) => ({
      name: f,
      path: join(backupDir, f),
      date: new Date(extractTimestamp(f))
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}
