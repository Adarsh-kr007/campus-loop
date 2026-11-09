import { Router } from 'express'
import { deleteAdminItem, getAdminStats, updateAdminItemStatus } from '../controllers/adminController.js'
import { listAdminItems } from '../controllers/itemController.js'
import { listClaims } from '../controllers/claimController.js'
import { protect } from '../middleware/authMiddleware.js'
import { adminOnly } from '../middleware/adminMiddleware.js'
import { validatePlainQuery, validateRequest } from '../middleware/validateMiddleware.js'
import { adminItemQueryValidators, idValidator, statusValidators } from '../validators/itemValidators.js'
import { claimQueryValidators } from '../validators/claimValidators.js'

const router = Router()
router.use(protect, adminOnly)
router.get('/stats', getAdminStats)
router.get('/items', validatePlainQuery, adminItemQueryValidators, validateRequest, listAdminItems)
router.get('/claims', validatePlainQuery, claimQueryValidators, validateRequest, listClaims)
router.patch('/items/:id/status', idValidator, statusValidators, validateRequest, updateAdminItemStatus)
router.delete('/items/:id', idValidator, validateRequest, deleteAdminItem)
export default router
