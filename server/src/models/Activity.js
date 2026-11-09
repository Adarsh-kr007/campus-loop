import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, trim: true, maxlength: 300 },
}, { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; if (ret.userId?._id) ret.userId = ret.userId._id.toString(); return ret } } })

schema.index({ userId: 1, createdAt: -1 })
export default mongoose.model('Activity', schema)
