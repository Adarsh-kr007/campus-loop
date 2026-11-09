import mongoose from 'mongoose'
import Item from '../models/Item.js'
import Claim from '../models/Claim.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { success, failure } from '../utils/apiResponse.js'
import { bodyData } from '../middleware/validateMiddleware.js'
import { changeItemStatus } from './itemController.js'
import { logActivity } from '../utils/logActivity.js'

export const getAdminStats = asyncHandler(async (req, res) => {
  const [totalReported, totalFound, pendingClaims, recoveredItems] = await Promise.all([
    Item.countDocuments(), Item.countDocuments({ type: 'found' }), Claim.countDocuments({ status: 'pending' }), Item.countDocuments({ status: 'recovered' }),
  ])
  return success(res, 'Admin statistics retrieved', { totalReported, totalFound, pendingClaims, recoveredItems })
})

export const updateAdminItemStatus = asyncHandler(async (req, res) => {
  const { status } = bodyData(req)
  if (!['active', 'recovered', 'closed'].includes(status)) return failure(res, 'Status must be active, recovered, or closed', 400)
  const item = await Item.findById(req.params.id)
  if (!item) return failure(res, 'Item not found', 404)
  if (item.status === status) return success(res, 'Item status unchanged', { item })
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => changeItemStatus(item, status, req.user, session))
    await item.populate('postedBy', 'name')
    return success(res, 'Item status updated', { item })
  } finally { await session.endSession() }
})

export const deleteAdminItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id)
  if (!item) return failure(res, 'Item not found', 404)
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Claim.deleteMany({ itemId: item._id }, { session })
      await item.deleteOne({ session })
      await logActivity(req.user._id, `Deleted listing: ${item.title}.`, { session })
    })
    return success(res, 'Item deleted successfully', {})
  } finally { await session.endSession() }
})
