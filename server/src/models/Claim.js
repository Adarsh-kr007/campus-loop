import mongoose from 'mongoose'
import { CLAIM_STATUSES } from '../constants/index.js'

const schema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimantName: { type: String, trim: true, required: true, minlength: 2, maxlength: 60 },
  claimantEmail: { type: String, trim: true, lowercase: true, required: true, maxlength: 100 },
  identifyingDetails: { type: String, trim: true, required: true, minlength: 20, maxlength: 1000 },
  ownershipReason: { type: String, trim: true, required: true, minlength: 20, maxlength: 1000 },
  status: { type: String, enum: CLAIM_STATUSES, default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; if (ret.itemId?._id) ret.itemId = ret.itemId._id.toString(); if (ret.createdBy?._id) ret.createdBy = ret.createdBy._id.toString(); return ret } } })

schema.index({ itemId: 1, createdBy: 1 }, { unique: true })
schema.index({ status: 1, createdAt: -1 })
schema.index({ createdBy: 1, createdAt: -1 })

export default mongoose.model('Claim', schema)
