import Item from '../models/Item.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { success } from '../utils/apiResponse.js'

export const getPublicStats = asyncHandler(async (req, res) => {
  const [itemsReported, itemsRecovered, activeListings] = await Promise.all([
    Item.countDocuments(), Item.countDocuments({ status: 'recovered' }), Item.countDocuments({ status: { $in: ['active', 'claim_pending'] } }),
  ])
  return success(res, 'Campus Loop statistics', { itemsReported, itemsRecovered, activeListings })
})
