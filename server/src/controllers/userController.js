import Item from '../models/Item.js'
import Claim from '../models/Claim.js'
import Activity from '../models/Activity.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { success } from '../utils/apiResponse.js'
import { paginationMeta, parsePagination } from '../utils/pagination.js'
import { queryData } from '../middleware/validateMiddleware.js'
import { getMyClaims as listUserClaims } from './claimController.js'

export const getProfile = asyncHandler(async (req, res) => {
  const [totalItems, lostItems, foundItems, recoveredItems, pendingClaims] = await Promise.all([
    Item.countDocuments({ postedBy: req.user._id }),
    Item.countDocuments({ postedBy: req.user._id, type: 'lost' }),
    Item.countDocuments({ postedBy: req.user._id, type: 'found' }),
    Item.countDocuments({ postedBy: req.user._id, status: 'recovered' }),
    Claim.countDocuments({ createdBy: req.user._id, status: 'pending' }),
  ])
  return success(res, 'Profile retrieved', { user: req.user, stats: { totalItems, lostItems, foundItems, pendingClaims, recoveredItems } })
})

export const getMyItems = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(queryData(req))
  const where = { postedBy: req.user._id }
  const [items, total] = await Promise.all([Item.find(where).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('postedBy', 'name'), Item.countDocuments(where)])
  return success(res, 'Your items retrieved', { items, pagination: paginationMeta(page, limit, total) })
})

export const getDashboard = asyncHandler(async (req, res) => {
  const [totalItems, lostItems, foundItems, recoveredItems, pendingClaims] = await Promise.all([
    Item.countDocuments({ postedBy: req.user._id }),
    Item.countDocuments({ postedBy: req.user._id, type: 'lost' }),
    Item.countDocuments({ postedBy: req.user._id, type: 'found' }),
    Item.countDocuments({ postedBy: req.user._id, status: 'recovered' }),
    Claim.countDocuments({ createdBy: req.user._id, status: 'pending' }),
  ])
  return success(res, 'Dashboard retrieved', { stats: { totalItems, lostItems, foundItems, pendingClaims, recoveredItems } })
})

export const getMyActivity = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(queryData(req))
  const where = { userId: req.user._id }
  const [activity, total] = await Promise.all([Activity.find(where).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Activity.countDocuments(where)])
  return success(res, 'Recent activity retrieved', { activity, pagination: paginationMeta(page, limit, total) })
})

export const getMyClaims = listUserClaims
