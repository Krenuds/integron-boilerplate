import log from 'electron-log'
import { app } from 'electron'
import { join } from 'path'

// Configure electron-log for file and console logging
// Keeps 3 rotated log files in the app's logs directory

const logsPath = join(app.getPath('userData'), 'logs')

// File transport configuration
log.transports.file.resolvePathFn = () => join(logsPath, 'main.log')
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB per file
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// Console transport configuration
log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}'

// Set default log level to debug (shows all)
log.transports.file.level = 'debug'
log.transports.console.level = 'debug'

// Archive old logs (keeps 3 files)
log.transports.file.archiveLogFn = (oldLogFile) => {
  const info = oldLogFile.toString()
  // Rotate: main.log -> main.1.log -> main.2.log -> deleted
  const file2 = info.replace('main.log', 'main.2.log')
  const file1 = info.replace('main.log', 'main.1.log')

  try {
    const fs = require('fs')
    // Delete oldest if exists
    if (fs.existsSync(file2)) {
      fs.unlinkSync(file2)
    }
    // Rotate 1 -> 2
    if (fs.existsSync(file1)) {
      fs.renameSync(file1, file2)
    }
    // Rotate current -> 1
    if (fs.existsSync(info)) {
      fs.renameSync(info, file1)
    }
  } catch {
    // Ignore rotation errors
  }
}

// Export configured logger
export const logger = log

// Helper to set log level dynamically
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
  log.transports.file.level = level
  log.transports.console.level = level
  logger.info(`Log level set to: ${level}`)
}

// Get current logs directory path
export function getLogsPath(): string {
  return logsPath
}
