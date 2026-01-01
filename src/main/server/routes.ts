import { Router, Request, Response } from 'express'
import { getDatabase, schema } from '../db'
import { eventQueue } from '../events/queue'
import { desc, eq } from 'drizzle-orm'
import { logger } from '../logger'

// Consistent API response types
interface ApiSuccessResponse<T> {
  success: true
  data: T
}

interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code: string
    details?: string
  }
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Helper to create error responses
function errorResponse(
  res: Response,
  status: number,
  message: string,
  code: string,
  details?: string
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: { message, code, details }
  }
  res.status(status).json(response)
}

// Helper to parse positive integer from query
function parsePositiveInt(value: unknown, defaultVal: number, max: number): number {
  if (typeof value !== 'string') return defaultVal
  const parsed = parseInt(value, 10)
  if (isNaN(parsed) || parsed < 0) return defaultVal
  return Math.min(parsed, max)
}

// API routes for overlay and external clients

export function createApiRouter(): Router {
  const router = Router()

  // GET /api/events - Get recent events
  router.get('/events', (req: Request, res: Response) => {
    try {
      const limit = parsePositiveInt(req.query.limit, 50, 200)
      const type = typeof req.query.type === 'string' ? req.query.type : undefined

      // Get from in-memory queue for speed
      let events = eventQueue.getRecent(limit)

      // Filter by type if specified
      if (type) {
        const types = type.split(',').filter(Boolean)
        events = events.filter((e) => types.includes(e.type))
      }

      res.json({
        success: true,
        data: {
          count: events.length,
          events
        }
      } as ApiResponse<{ count: number; events: typeof events }>)
    } catch (error) {
      logger.error('[API] Error fetching events:', error)
      errorResponse(
        res,
        500,
        'Failed to fetch events',
        'EVENTS_FETCH_ERROR',
        error instanceof Error ? error.message : undefined
      )
    }
  })

  // GET /api/users - Get user list
  router.get('/users', (req: Request, res: Response) => {
    try {
      const db = getDatabase()
      const limit = parsePositiveInt(req.query.limit, 50, 200)
      const offset = parsePositiveInt(req.query.offset, 0, 100000)

      const users = db
        .select()
        .from(schema.users)
        .orderBy(desc(schema.users.lastSeen))
        .limit(limit)
        .offset(offset)
        .all()

      // Get total count
      const countResult = db.select({ count: schema.users.id }).from(schema.users).all()

      res.json({
        success: true,
        data: {
          count: users.length,
          total: countResult.length,
          offset,
          users
        }
      } as ApiResponse<{ count: number; total: number; offset: number; users: typeof users }>)
    } catch (error) {
      logger.error('[API] Error fetching users:', error)
      errorResponse(
        res,
        500,
        'Failed to fetch users',
        'USERS_FETCH_ERROR',
        error instanceof Error ? error.message : undefined
      )
    }
  })

  // GET /api/users/:id - Get single user
  router.get('/users/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params
      if (!id || typeof id !== 'string') {
        errorResponse(res, 400, 'Invalid user ID', 'INVALID_USER_ID')
        return
      }

      const db = getDatabase()
      const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get()

      if (!user) {
        errorResponse(res, 404, 'User not found', 'USER_NOT_FOUND')
        return
      }

      res.json({
        success: true,
        data: { user }
      } as ApiResponse<{ user: typeof user }>)
    } catch (error) {
      logger.error('[API] Error fetching user:', error)
      errorResponse(
        res,
        500,
        'Failed to fetch user',
        'USER_FETCH_ERROR',
        error instanceof Error ? error.message : undefined
      )
    }
  })

  // GET /api/status - Server status
  router.get('/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'running',
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<{ status: string; timestamp: string }>)
  })

  return router
}
