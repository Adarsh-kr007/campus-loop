import { Router } from 'express'
import { getMyActivity, getMyClaims, getMyItems, getProfile } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validatePlainQuery, validateRequest } from '../middleware/validateMiddleware.js'
import { claimQueryValidators } from '../validators/claimValidators.js'

const router = Router()
router.use(protect)
router.get('/me', getProfile)
router.get('/me/items', validatePlainQuery, claimQueryValidators.slice(1), validateRequest, getMyItems)
router.get('/me/claims', validatePlainQuery, claimQueryValidators, validateRequest, getMyClaims)
router.get('/me/activity', validatePlainQuery, claimQueryValidators.slice(1), validateRequest, getMyActivity)
export default router
