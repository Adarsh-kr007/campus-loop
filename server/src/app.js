import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import itemRoutes from './routes/itemRoutes.js'
import claimRoutes from './routes/claimRoutes.js'
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import { success } from './utils/apiResponse.js'

export function createApp({ clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((value) => value.trim()) } = {}) {
  const app = express()
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin(origin, callback) {
    if (!origin || clientUrls.includes(origin)) return callback(null, true)
    const error = new Error('Origin is not allowed by CORS')
    error.status = 403
    return callback(error)
  }, credentials: false }))
  app.use(express.json({ limit: '10kb' }))
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please try again later.' } }))

  app.get('/api/health', (req, res) => success(res, 'OK', { uptime: process.uptime(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))
  app.use('/api/auth', authRoutes)
  app.use('/api/items', itemRoutes)
  app.use('/api/claims', claimRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/stats', statsRoutes)
  app.use(notFound)
  app.use(errorHandler)
  return app
}

export default createApp
