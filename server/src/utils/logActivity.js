import Activity from '../models/Activity.js'

export async function logActivity(userId, message, options = {}) {
  if (!userId) return null
  return Activity.create([{ userId, message }], options.session ? { session: options.session } : {})
}
