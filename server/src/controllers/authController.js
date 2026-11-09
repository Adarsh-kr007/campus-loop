import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { bodyData } from '../middleware/validateMiddleware.js'
import { generateToken } from '../utils/generateToken.js'
import { success, failure } from '../utils/apiResponse.js'

export const register = asyncHandler(async (req, res) => {
  const data = bodyData(req)
  const user = await User.create({ name: data.name, email: data.email.toLowerCase(), studentId: data.studentId, password: data.password, role: 'student' })
  return success(res, 'Account registered successfully', { user, token: generateToken(user.id) }, 201)
})

export const login = asyncHandler(async (req, res) => {
  const data = bodyData(req)
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password')
  if (!user || !(await bcrypt.compare(data.password, user.password))) return failure(res, 'Invalid email or password', 401)
  return success(res, 'Logged in successfully', { user, token: generateToken(user.id) })
})

export const me = asyncHandler(async (req, res) => success(res, 'Current user', { user: req.user }))

export const logout = asyncHandler(async (req, res) => success(res, 'Logged out. Discard the token on the client.', {}))
