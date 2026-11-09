import mongoose from 'mongoose'
import Claim from '../models/Claim.js'
import Item from '../models/Item.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { bodyData, queryData } from '../middleware/validateMiddleware.js'
import { paginationMeta, parsePagination } from '../utils/pagination.js'
import { success, failure } from '../utils/apiResponse.js'
import { logActivity } from '../utils/logActivity.js'

export const createClaim = asyncHandler(async (req, res) => {
  const data = bodyData(req)
  const item = await Item.findById(data.itemId)
  if (!item) return failure(res, 'Item not found', 404)
  if (item.type !== 'found' || !['active', 'claim_pending'].includes(item.status)) return failure(res, 'Only active found items can receive claims', 409)
  if (item.postedBy.equals(req.user._id)) return failure(res, 'You cannot claim your own item', 403)

  const session = await mongoose.startSession()
  let claim
  try {
    await session.withTransaction(async () => {
      const currentItem = await Item.findOne({ _id: item._id, status: { $in: ['active', 'claim_pending'] }, type: 'found' }).session(session)
      if (!currentItem) { const error = new Error('This item is no longer available for claims'); error.statusCode = 409; throw error }
      ;[claim] = await Claim.create([{ ...data, itemId: item._id, createdBy: req.user._id, status: 'pending' }], { session })
      currentItem.status = 'claim_pending'
      await currentItem.save({ session })
      await logActivity(req.user._id, `Submitted a claim for “${currentItem.title}”.`, { session })
      await logActivity(currentItem.postedBy, `A claim was submitted for “${currentItem.title}”.`, { session })
    })
  } finally { await session.endSession() }
  return success(res, 'Claim submitted successfully', { claim }, 201)
})

export const getMyClaims = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(queryData(req))
  const where = { createdBy: req.user._id }
  const [claims, total] = await Promise.all([
    Claim.find(where).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate({ path: 'itemId', select: 'title type category location status imageUrl date' }),
    Claim.countDocuments(where),
  ])
  return success(res, 'Your claims retrieved', { claims, pagination: paginationMeta(page, limit, total) })
})

export const getClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id).populate({ path: 'itemId', select: 'title type category location status imageUrl date postedBy', populate: { path: 'postedBy', select: 'name' } })
  if (!claim) return failure(res, 'Claim not found', 404)
  if (req.user.role !== 'admin' && !claim.createdBy.equals(req.user._id)) return failure(res, 'You cannot view this claim', 403)
  return success(res, 'Claim retrieved', { claim })
})

export const listClaims = asyncHandler(async (req, res) => {
  const filters = queryData(req)
  const { page, limit } = parsePagination(filters)
  const where = filters.status ? { status: filters.status } : {}
  const [claims, total] = await Promise.all([
    Claim.find(where).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
      .populate({ path: 'itemId', select: 'title type category location status imageUrl' }).populate('createdBy', 'name email studentId'),
    Claim.countDocuments(where),
  ])
  return success(res, 'Claims retrieved', { claims, pagination: paginationMeta(page, limit, total) })
})

export const updateClaimStatus = asyncHandler(async (req, res) => {
  const { status } = bodyData(req)
  const session = await mongoose.startSession()
  let result
  try {
    await session.withTransaction(async () => {
      const claim = await Claim.findById(req.params.id).session(session)
      if (!claim) { const error = new Error('Claim not found'); error.statusCode = 404; throw error }
      if (claim.status !== 'pending') { const error = new Error('This claim has already been decided'); error.statusCode = 409; throw error }
      const item = await Item.findById(claim.itemId).session(session)
      if (!item) { const error = new Error('Item not found'); error.statusCode = 404; throw error }

      if (status === 'approved') {
        const pending = await Claim.find({ itemId: item._id, status: 'pending' }).session(session)
        await Claim.updateMany({ itemId: item._id, status: 'pending' }, { $set: { status: 'rejected' } }, { session })
        claim.status = 'approved'
        await claim.save({ session })
        item.status = 'recovered'
        await item.save({ session })
        for (const other of pending) if (!other._id.equals(claim._id)) await logActivity(other.createdBy, `Your claim for “${item.title}” was rejected because another claim was approved.`, { session })
        await logActivity(claim.createdBy, `Your claim for “${item.title}” was approved.`, { session })
      } else {
        claim.status = 'rejected'
        await claim.save({ session })
        const remaining = await Claim.countDocuments({ itemId: item._id, status: 'pending' }).session(session)
        item.status = remaining ? 'claim_pending' : 'active'
        await item.save({ session })
        await logActivity(claim.createdBy, `Your claim for “${item.title}” was rejected.`, { session })
      }
      await logActivity(req.user._id, `Decided a claim for “${item.title}”: ${status}.`, { session })
      result = claim
    })
  } finally { await session.endSession() }
  return success(res, `Claim ${status}`, { claim: result })
})
