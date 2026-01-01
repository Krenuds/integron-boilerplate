import { Router } from 'express'
import { getDatabase, schema } from '../db'
import { eventQueue } from '../events/queue'
import { desc, eq } from 'drizzle-orm'

// API routes for overlay and external clients

export function createApiRouter(): Router {
  const router = Router()

  // GET /api/events - Get recent events
  router.get('/events', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
      const type = req.query.type as string | undefined

      // Get from in-memory queue for speed
      let events = eventQueue.getRecent(limit)

      // Filter by type if specified
      if (type) {
        const types = type.split(',')
        events = events.filter((e) => types.includes(e.type))
      }

      res.json({
        success: true,
        count: events.length,
        events
      })
    } catch (error) {
      console.error('[API] Error fetching events:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch events'
      })
    }
  })

  // GET /api/users - Get user list
  router.get('/users', (req, res) => {
    try {
      const db = getDatabase()
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
      const offset = parseInt(req.query.offset as string) || 0

      const users = db
        .select()
        .from(schema.users)
        .orderBy(desc(schema.users.lastSeen))
        .limit(limit)
        .offset(offset)
        .all()

      // Get total count
      const countResult = db
        .select({ count: schema.users.id })
        .from(schema.users)
        .all()

      res.json({
        success: true,
        count: users.length,
        total: countResult.length,
        offset,
        users
      })
    } catch (error) {
      console.error('[API] Error fetching users:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      })
    }
  })

  // GET /api/users/:id - Get single user
  router.get('/users/:id', (req, res) => {
    try {
      const db = getDatabase()
      const user = db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, req.params.id))
        .get()

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        })
        return
      }

      res.json({
        success: true,
        user
      })
    } catch (error) {
      console.error('[API] Error fetching user:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user'
      })
    }
  })

  // GET /api/status - Server status
  router.get('/status', (_req, res) => {
    res.json({
      success: true,
      status: 'running',
      timestamp: new Date().toISOString()
    })
  })

  return router
}
