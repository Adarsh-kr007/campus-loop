import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../constants/index.js'

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 100, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, unique: true, index: true },
  studentId: { type: String, required: true, trim: true, minlength: 3, maxlength: 20, match: /^[A-Za-z0-9_-]+$/, unique: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'student', immutable: true },
}, { timestamps: true, toJSON: { transform: (_, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; delete ret.password; return ret } } })

schema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12)
})

schema.methods.comparePassword = function comparePassword(candidate) { return bcrypt.compare(candidate, this.password) }

export default mongoose.model('User', schema)
