import mongoose from 'mongoose'
import { failure } from '../utils/apiResponse.js'

export function notFound(req, res) { return failure(res, `Route not found: ${req.method} ${req.originalUrl}`, 404) }

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error?.type === 'entity.too.large') return failure(res, 'Request body is too large', 413)
  if (error?.type === 'entity.parse.failed') return failure(res, 'Malformed JSON request body', 400)
  if (error instanceof mongoose.Error.ValidationError) {
    return failure(res, 'Validation failed', 400, Object.values(error.errors).map((entry) => ({ field: entry.path, message: entry.message })))
  }
  if (error instanceof mongoose.Error.CastError) return failure(res, 'Invalid resource identifier', 400)
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'value'
    const label = field === 'studentId' ? 'Student ID' : field.charAt(0).toUpperCase() + field.slice(1)
    return failure(res, `${label} already registered`, 409)
  }
  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') return failure(res, 'Invalid or expired token', 401)
  if (error?.name === 'MongoServerError' && error?.code === 112) return failure(res, 'The request conflicted with another update. Please retry.', 409)
  const status = Number(error.statusCode || error.status) || 500
  const message = status >= 500 ? 'Something went wrong on the server' : error.message
  if (process.env.NODE_ENV !== 'production' && status >= 500) console.error(`API error: ${error.name || 'UnknownError'}`)
  return failure(res, message, status)
}
