import { failure } from '../utils/apiResponse.js'

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return failure(res, 'Admin access required', 403)
  next()
}
