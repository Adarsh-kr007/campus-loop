import { Router } from 'express'
import { createClaim, getClaim, getMyClaims, listClaims, updateClaimStatus } from '../controllers/claimController.js'
import { protect } from '../middleware/authMiddleware.js'
import { adminOnly } from '../middleware/adminMiddleware.js'
import { validatePlainQuery, validateRequest } from '../middleware/validateMiddleware.js'
import { claimIdValidator, claimQueryValidators, claimStatusValidator, createClaimValidators } from '../validators/claimValidators.js'

const router = Router()
router.use(protect)
router.post('/', createClaimValidators, validateRequest, createClaim)
router.get('/my', validatePlainQuery, claimQueryValidators, validateRequest, getMyClaims)
router.get('/:id', claimIdValidator, validateRequest, getClaim)
router.get('/', adminOnly, validatePlainQuery, claimQueryValidators, validateRequest, listClaims)
router.patch('/:id/status', adminOnly, claimIdValidator, claimStatusValidator, validateRequest, updateClaimStatus)
export default router
