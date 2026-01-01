import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import type { TwitchEvent } from '../../shared/event-types'

// WebSocket server for real-time event broadcasting to overlay clients

interface Client {
  ws: WebSocket
  id: string
  connectedAt: Date
}

class WebSocketHandler {
  private wss: WebSocketServer | null = null
  private clients: Map<string, Client> = new Map()
  private clientIdCounter = 0

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', (ws) => {
      const clientId = `client_${++this.clientIdCounter}`
      const client: Client = {
        ws,
        id: clientId,
        connectedAt: new Date()
      }

      this.clients.set(clientId, client)
      console.log(`[WebSocket] Client connected: ${clientId} (total: ${this.clients.size})`)

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          clientId,
          timestamp: new Date().toISOString()
        })
      )

      ws.on('close', () => {
        this.clients.delete(clientId)
        console.log(`[WebSocket] Client disconnected: ${clientId} (total: ${this.clients.size})`)
      })

      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error ${clientId}:`, error.message)
        this.clients.delete(clientId)
      })

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        // Client responded to ping
      })
    })

    // Heartbeat to detect dead connections
    setInterval(() => {
      this.clients.forEach((client, id) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping()
        } else {
          this.clients.delete(id)
        }
      })
    }, 30000)

    console.log('[WebSocket] Server initialized')
  }

  broadcast(event: TwitchEvent): void {
    if (!this.wss) return

    const message = JSON.stringify({
      type: 'event',
      event,
      timestamp: new Date().toISOString()
    })

    let sent = 0
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
        sent++
      }
    })

    if (sent > 0) {
      console.log(`[WebSocket] Broadcast event ${event.type} to ${sent} clients`)
    }
  }

  getConnectionCount(): number {
    return this.clients.size
  }

  getClients(): { id: string; connectedAt: string }[] {
    return Array.from(this.clients.values()).map((c) => ({
      id: c.id,
      connectedAt: c.connectedAt.toISOString()
    }))
  }

  close(): void {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.ws.close(1000, 'Server shutting down')
      })
      this.clients.clear()
      this.wss.close()
      this.wss = null
      console.log('[WebSocket] Server closed')
    }
  }
}

// Singleton instance
export const wsHandler = new WebSocketHandler()
