import { Router } from 'express'
import { register, login, me, logout } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateMiddleware.js'
import { registerValidators, loginValidators } from '../validators/authValidators.js'
import { rateLimit } from 'express-rate-limit'

const router = Router()
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts. Please try again later.' } })
router.post('/register', authLimiter, registerValidators, validateRequest, register)
router.post('/login', authLimiter, loginValidators, validateRequest, login)
router.get('/me', protect, me)
router.post('/logout', protect, logout)
export default router
