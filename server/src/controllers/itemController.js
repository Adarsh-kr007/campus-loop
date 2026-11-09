import mongoose from 'mongoose'
import Item from '../models/Item.js'
import Claim from '../models/Claim.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { bodyData, queryData } from '../middleware/validateMiddleware.js'
import { escapeRegex } from '../utils/escapeRegex.js'
import { paginationMeta, parsePagination } from '../utils/pagination.js'
import { success, failure } from '../utils/apiResponse.js'
import { parseItemDate } from '../validators/itemValidators.js'
import { logActivity } from '../utils/logActivity.js'

function publicItem(item, includeContact) {
  const value = item.toJSON()
  if (!includeContact) { delete value.contactEmail; delete value.contactPhone }
  return value
}

function buildItemFilter(filters, { admin = false } = {}) {
  const where = {}
  if (!admin) {
    if (filters.status) where.status = filters.status
    else where.status = { $in: ['active', 'claim_pending'] }
  } else if (filters.status) where.status = filters.status
  if (filters.type) where.type = filters.type
  if (filters.category) where.category = filters.category
  if (filters.location) where.location = filters.location
  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q.trim()), 'i')
    where.$or = [{ title: regex }, { description: regex }, { location: regex }]
  }
  if (filters.dateRange) {
    const days = filters.dateRange === '7d' ? 7 : 30
    where.date = { ...(where.date || {}), $gte: new Date(Date.now() - days * 86400000) }
  }
  if (filters.date) {
    const start = parseItemDate(filters.date)
    const end = new Date(start.getTime() + 86400000)
    where.date = { ...(where.date || {}), $gte: start, $lt: end }
  }
  return where
}

function paginationOptions(query) {
  const { page, limit } = parsePagination(query)
  return { page, limit, skip: (page - 1) * limit, sort: query.sort === 'oldest' ? { createdAt: 1, _id: 1 } : { createdAt: -1, _id: -1 } }
}

export const listItems = asyncHandler(async (req, res) => {
  const filters = queryData(req)
  const { page, limit, skip, sort } = paginationOptions(filters)
  const where = buildItemFilter(filters)
  const [records, total] = await Promise.all([
    Item.find(where).sort(sort).skip(skip).limit(limit).populate('postedBy', 'name'),
    Item.countDocuments(where),
  ])
  const items = records.map((item) => publicItem(item, Boolean(req.user)))
  return success(res, 'Items retrieved', { items, pagination: paginationMeta(page, limit, total) })
})

export const getItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate('postedBy', 'name')
  if (!item) return failure(res, 'Item not found', 404)
  const owner = item.postedBy?._id?.equals(req.user?._id)
  if (item.status === 'closed' && !owner && req.user?.role !== 'admin') return failure(res, 'Item not found', 404)
  return success(res, 'Item retrieved', { item: publicItem(item, Boolean(req.user)) })
})

export const createItem = asyncHandler(async (req, res) => {
  const data = bodyData(req)
  const item = await Item.create({ ...data, date: parseItemDate(data.date), imageUrl: data.imageUrl || null, contactPhone: data.contactPhone || undefined, postedBy: req.user._id, status: 'active' })
  await logActivity(req.user._id, `Reported ${item.type} item: ${item.title}.`)
  await item.populate('postedBy', 'name')
  return success(res, 'Item created successfully', { item: publicItem(item, true) }, 201)
})

async function findEditableItem(req, res) {
  const item = await Item.findById(req.params.id)
  if (!item) { failure(res, 'Item not found', 404); return null }
  if (!item.postedBy.equals(req.user._id) && req.user.role !== 'admin') { failure(res, 'You cannot manage this item', 403); return null }
  return item
}

export const updateItem = asyncHandler(async (req, res) => {
  const item = await findEditableItem(req, res)
  if (!item) return
  if (['recovered', 'closed'].includes(item.status)) return failure(res, 'Recovered or closed items cannot be edited', 409)
  const data = bodyData(req)
  if (data.date) data.date = parseItemDate(data.date)
  if (data.imageUrl === '') data.imageUrl = null
  if (data.contactPhone === '') data.contactPhone = undefined
  Object.assign(item, data)
  await item.save()
  await item.populate('postedBy', 'name')
  return success(res, 'Item updated successfully', { item: publicItem(item, true) })
})

export async function changeItemStatus(item, status, actor, session) {
  const previousStatus = item.status
  if (previousStatus === status) return item
  item.status = status
  await item.save({ session })
  if (previousStatus === 'claim_pending' && status !== 'claim_pending') {
    const pending = await Claim.find({ itemId: item._id, status: 'pending' }).session(session)
    await Claim.updateMany({ itemId: item._id, status: 'pending' }, { $set: { status: 'rejected' } }, { session })
    for (const claim of pending) await logActivity(claim.createdBy, `Your claim for “${item.title}” was rejected because the listing status changed.`, { session })
  }
  await logActivity(actor._id, `Changed “${item.title}” status to ${status}.`, { session })
  return item
}

export const updateItemStatus = asyncHandler(async (req, res) => {
  const item = await findEditableItem(req, res)
  if (!item) return
  const { status } = bodyData(req)
  if (status === 'active' && req.user.role !== 'admin') return failure(res, 'Only admins can reopen listings', 403)
  if (item.status === status) return success(res, 'Item status unchanged', { item })
  if (req.user.role !== 'admin' && !['recovered', 'closed'].includes(status)) return failure(res, 'You cannot set this item status', 403)
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => { await changeItemStatus(item, status, req.user, session) })
    await item.populate('postedBy', 'name')
    return success(res, 'Item status updated', { item: publicItem(item, true) })
  } finally { await session.endSession() }
})

export const deleteItem = asyncHandler(async (req, res) => {
  const item = await findEditableItem(req, res)
  if (!item) return
  if (req.user.role !== 'admin' && !['active', 'closed'].includes(item.status)) return failure(res, 'This item cannot be deleted while it has an active claim or is recovered', 409)
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

export const listAdminItems = asyncHandler(async (req, res) => {
  const filters = queryData(req)
  const { page, limit, skip, sort } = paginationOptions(filters)
  const where = buildItemFilter(filters, { admin: true })
  const [records, total] = await Promise.all([Item.find(where).sort(sort).skip(skip).limit(limit).populate('postedBy', 'name'), Item.countDocuments(where)])
  return success(res, 'Listings retrieved', { items: records.map((item) => publicItem(item, true)), pagination: paginationMeta(page, limit, total) })
})

export const adminDeleteItem = deleteItem
