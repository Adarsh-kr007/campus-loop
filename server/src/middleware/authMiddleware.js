import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { failure } from '../utils/apiResponse.js'

function tokenFrom(req) {
  const header = req.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
}

async function loadUser(req, optional) {
  const token = tokenFrom(req)
  if (!token) return optional ? null : { error: 'Authentication required', status: 401 }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    if (!user) return optional ? null : { error: 'Invalid or expired token', status: 401 }
    req.user = user
    return null
  } catch {
    return optional ? null : { error: 'Invalid or expired token', status: 401 }
  }
}

export const protect = asyncHandler(async (req, res, next) => {
  const issue = await loadUser(req, false)
  if (issue) return failure(res, issue.error, issue.status)
  next()
})

export const optionalAuth = asyncHandler(async (req, res, next) => {
  await loadUser(req, true)
  next()
})
