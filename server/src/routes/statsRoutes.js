import { Router } from 'express'
import { getPublicStats } from '../controllers/statsController.js'

const router = Router()
router.get('/', getPublicStats)
export default router
