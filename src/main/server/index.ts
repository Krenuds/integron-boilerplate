import express from 'express'
import { createServer, Server } from 'http'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { createApiRouter } from './routes'
import { wsHandler } from './websocket'
import { eventBus } from '../events/bus'

// Get the path to the out directory (where main process runs from)
function getOverlayPath(): string {
  // __dirname in built code is out/main, so overlays are at out/overlays
  // This works for both dev and production
  const outDir = dirname(__dirname) // out/main -> out
  return join(outDir, 'overlays')
}

// HTTP + WebSocket server for overlays and API

const DEFAULT_PORT = 9847

class OverlayServer {
  private app: express.Application | null = null
  private server: Server | null = null
  private port: number = DEFAULT_PORT
  private isRunning = false

  async start(port: number = DEFAULT_PORT): Promise<void> {
    if (this.isRunning) {
      console.log('[Server] Already running')
      return
    }

    this.port = port
    this.app = express()

    // Middleware
    this.app.use(express.json())

    // CORS for overlay access
    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })

    // API routes
    this.app.use('/api', createApiRouter())

    // Serve overlay static files
    const overlayPath = getOverlayPath()
    console.log(`[Server] Looking for overlays at: ${overlayPath}`)
    if (existsSync(overlayPath)) {
      this.app.use('/overlay', express.static(overlayPath))
      console.log(`[Server] Serving overlays from ${overlayPath}`)
    } else {
      console.log('[Server] Overlay directory not found - run "npm run build:overlays" first')
    }

    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', uptime: process.uptime() })
    })

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({ error: 'Not found' })
    })

    // Create HTTP server
    this.server = createServer(this.app)

    // Initialize WebSocket
    wsHandler.initialize(this.server)

    // Connect event bus to WebSocket broadcast
    eventBus.onEvent((event) => {
      wsHandler.broadcast(event)
    })

    // Start listening
    return new Promise((resolve, reject) => {
      this.server!.listen(this.port, () => {
        this.isRunning = true
        console.log(`[Server] HTTP server running on http://localhost:${this.port}`)
        console.log(`[Server] WebSocket available at ws://localhost:${this.port}`)
        console.log(`[Server] API available at http://localhost:${this.port}/api`)
        resolve()
      })

      this.server!.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`[Server] Port ${this.port} is already in use`)
        } else {
          console.error('[Server] Failed to start:', error.message)
        }
        reject(error)
      })
    })
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server || !this.isRunning) {
        resolve()
        return
      }

      wsHandler.close()

      this.server.close(() => {
        this.isRunning = false
        this.server = null
        this.app = null
        console.log('[Server] Stopped')
        resolve()
      })
    })
  }

  async restart(port?: number): Promise<void> {
    await this.stop()
    await this.start(port || this.port)
  }

  getStatus(): { running: boolean; port: number; connections: number } {
    return {
      running: this.isRunning,
      port: this.port,
      connections: wsHandler.getConnectionCount()
    }
  }

  getPort(): number {
    return this.port
  }

  isServerRunning(): boolean {
    return this.isRunning
  }
}

// Singleton instance
export const overlayServer = new OverlayServer()
