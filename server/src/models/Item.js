import mongoose from 'mongoose'
import { CATEGORIES, ITEM_STATUSES, ITEM_TYPES, LOCATIONS } from '../constants/index.js'

const schema = new mongoose.Schema({
  type: { type: String, enum: ITEM_TYPES, required: true, immutable: true },
  title: { type: String, trim: true, required: true, minlength: 3, maxlength: 100 },
  description: { type: String, trim: true, required: true, minlength: 20, maxlength: 1000 },
  category: { type: String, enum: CATEGORIES, required: true },
  location: { type: String, enum: LOCATIONS, required: true },
  date: { type: Date, required: true },
  imageUrl: { type: String, default: null, maxlength: 500, validate: { validator: (value) => value == null || value === '' || /^https:\/\//i.test(value), message: 'imageUrl must be an HTTPS URL' } },
  contactName: { type: String, trim: true, required: true, minlength: 2, maxlength: 60 },
  contactEmail: { type: String, trim: true, lowercase: true, required: true, maxlength: 100 },
  contactPhone: { type: String, trim: true, maxlength: 20 },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ITEM_STATUSES, default: 'active' },
}, { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; if (ret.postedBy?._id) ret.postedBy = { id: ret.postedBy._id.toString(), name: ret.postedBy.name }; else if (ret.postedBy?.id) ret.postedBy = { id: ret.postedBy.id.toString(), name: ret.postedBy.name }; return ret } } })

schema.index({ status: 1, createdAt: -1 })
schema.index({ type: 1 })
schema.index({ category: 1 })
schema.index({ location: 1 })
schema.index({ postedBy: 1, createdAt: -1 })
schema.index({ date: -1 })

export default mongoose.model('Item', schema)
