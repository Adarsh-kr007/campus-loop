import { validateEnv } from '../src/config/env.js'
import { connectDatabase } from '../src/config/db.js'
import User from '../src/models/User.js'

async function seedAdmin() {
  const required = ['ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_STUDENT_ID', 'ADMIN_PASSWORD']
  const missing = required.filter((key) => !process.env[key]?.trim())
  if (missing.length) throw new Error(`Missing seed variable(s): ${missing.join(', ')}`)
  if (Buffer.byteLength(process.env.ADMIN_PASSWORD, 'utf8') < 8 || Buffer.byteLength(process.env.ADMIN_PASSWORD, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must be between 8 and 72 bytes')
  }

  const email = process.env.ADMIN_EMAIL.trim().toLowerCase()
  const existing = await User.findOne({ email }).select('+password')
  if (existing) {
    existing.name = process.env.ADMIN_NAME.trim()
    existing.studentId = process.env.ADMIN_STUDENT_ID.trim()
    existing.password = process.env.ADMIN_PASSWORD
    await existing.save()
    await User.collection.updateOne({ _id: existing._id }, { $set: { role: 'admin' } })
    process.stdout.write('Admin account updated.\n')
    return
  }
  await User.create({ name: process.env.ADMIN_NAME.trim(), email, studentId: process.env.ADMIN_STUDENT_ID.trim(), password: process.env.ADMIN_PASSWORD, role: 'admin' })
  process.stdout.write('Admin account created.\n')
}

try {
  const { mongoUri } = validateEnv()
  try { await connectDatabase(mongoUri) } catch {
    throw new Error('Could not connect to MongoDB. Check the URI, database credentials, and Atlas network access.')
  }
  await seedAdmin()
} catch (error) {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
} finally {
  const mongoose = await import('mongoose')
  await mongoose.default.disconnect()
}
