import { Router } from 'express'
import { createItem, deleteItem, getItem, listItems, updateItem, updateItemStatus } from '../controllers/itemController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'
import { validatePlainQuery, validateRequest } from '../middleware/validateMiddleware.js'
import { createItemValidators, idValidator, itemQueryValidators, statusValidators, updateItemValidators } from '../validators/itemValidators.js'

const router = Router()
router.get('/', optionalAuth, validatePlainQuery, itemQueryValidators, validateRequest, listItems)
router.post('/', protect, createItemValidators, validateRequest, createItem)
router.get('/:id', optionalAuth, idValidator, validateRequest, getItem)
router.put('/:id', protect, idValidator, updateItemValidators, validateRequest, updateItem)
router.patch('/:id/status', protect, idValidator, statusValidators, validateRequest, updateItemStatus)
router.delete('/:id', protect, idValidator, validateRequest, deleteItem)
export default router
