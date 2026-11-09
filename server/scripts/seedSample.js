import { validateEnv } from '../src/config/env.js'
import { connectDatabase } from '../src/config/db.js'
import User from '../src/models/User.js'
import Item from '../src/models/Item.js'
import Claim from '../src/models/Claim.js'

if (process.env.NODE_ENV === 'production') {
  process.stderr.write('Sample seeding is disabled when NODE_ENV=production.\n')
  process.exitCode = 1
} else {
  const required = ['SEED_STUDENT_NAME', 'SEED_STUDENT_EMAIL', 'SEED_STUDENT_ID', 'SEED_STUDENT_PASSWORD', 'ADMIN_EMAIL']
  const missing = required.filter((key) => !process.env[key]?.trim())

  if (missing.length) {
    process.stderr.write(`Missing seed variable(s): ${missing.join(', ')}\n`)
    process.exitCode = 1
  } else if (Buffer.byteLength(process.env.SEED_STUDENT_PASSWORD, 'utf8') < 8 || Buffer.byteLength(process.env.SEED_STUDENT_PASSWORD, 'utf8') > 72) {
    process.stderr.write('SEED_STUDENT_PASSWORD must be between 8 and 72 bytes.\n')
    process.exitCode = 1
  } else {
    const samples = [
      { title: 'Sample: Navy backpack left in the library', type: 'lost', category: 'Bags', location: 'Library', daysAgo: 1, description: 'A navy canvas backpack with a stitched mountain patch was last seen beside the quiet study tables.' },
      { title: 'Sample: Blue insulated bottle near the canteen', type: 'lost', category: 'Other', location: 'Canteen', daysAgo: 2, description: 'A blue steel water bottle with a silver lid may have been left near the outdoor lunch benches.' },
      { title: 'Sample: Student ID card outside Academic Block', type: 'found', category: 'Documents', location: 'Academic Block', daysAgo: 1, description: 'A student identification card was found on the steps by the main Academic Block entrance.' },
      { title: 'Sample: Wireless earbuds in Computer Lab', type: 'found', category: 'Electronics', location: 'Computer Lab', daysAgo: 3, description: 'A white wireless earbud case containing both earbuds was found beside a workstation.' },
      { title: 'Sample: Calculator left after a lecture', type: 'found', category: 'Electronics', location: 'Classroom Block', daysAgo: 4, description: 'A black scientific calculator with a clear protective cover was found under a lecture hall desk.' },
      { title: 'Sample: Green notebook in the library', type: 'found', category: 'Books', location: 'Library', daysAgo: 5, description: 'A green spiral notebook with handwritten biology notes was handed in at the library desk.' },
      { title: 'Sample: Grey hoodie in the student common room', type: 'found', category: 'Clothing', location: 'Hostel', daysAgo: 6, description: 'A grey hooded sweatshirt with a small campus crest was found folded over a common room chair.' },
      { title: 'Sample: Silver watch near the sports ground', type: 'lost', category: 'Accessories', location: 'Sports Ground', daysAgo: 7, description: 'A silver wristwatch with a dark round face went missing after afternoon sports practice.' },
      { title: 'Sample: USB drive by the parking area', type: 'lost', category: 'Electronics', location: 'Parking Area', daysAgo: 8, description: 'A red USB flash drive with a short fabric loop may have been dropped along the parking walkway.' },
      { title: 'Sample: Blue folder at the Admin Office', type: 'found', category: 'Documents', location: 'Admin Office', daysAgo: 9, description: 'A blue document folder containing lecture handouts was turned in at the campus administration desk.' },
      { title: 'Sample: Keys with a yellow tag in the canteen', type: 'found', category: 'Other', location: 'Canteen', daysAgo: 10, description: 'A small ring holding three keys and a yellow plastic tag was found near the canteen entrance.' },
      { title: 'Sample: Engineering textbook in Classroom Block', type: 'lost', category: 'Books', location: 'Classroom Block', daysAgo: 11, description: 'An engineering mathematics textbook with handwritten notes in the margins was misplaced after class.' },
      { title: 'Sample: Leather wallet handed in at Library', type: 'found', category: 'Accessories', location: 'Library', daysAgo: 12, description: 'A brown leather wallet was found beside the library printers and is being held at the front desk.', owner: 'admin' },
      { title: 'Sample: Laptop charger found in Computer Lab', type: 'found', category: 'Electronics', location: 'Computer Lab', daysAgo: 13, description: 'A black laptop power adapter with a long cable was left beside the rear row of computers.', owner: 'admin' },
    ]

    try {
      const { mongoUri } = validateEnv()
      await connectDatabase(mongoUri)
      const studentEmail = process.env.SEED_STUDENT_EMAIL.trim().toLowerCase()
      const studentId = process.env.SEED_STUDENT_ID.trim()
      let student = await User.findOne({ email: studentEmail }).select('+password')
      if (student) {
        student.name = process.env.SEED_STUDENT_NAME.trim()
        student.studentId = studentId
        student.password = process.env.SEED_STUDENT_PASSWORD
        await student.save()
        await User.collection.updateOne({ _id: student._id }, { $set: { role: 'student' } })
      } else {
        student = await User.create({ name: process.env.SEED_STUDENT_NAME.trim(), email: studentEmail, studentId, password: process.env.SEED_STUDENT_PASSWORD, role: 'student' })
      }
      const admin = await User.findOne({ email: process.env.ADMIN_EMAIL.trim().toLowerCase() })
      if (!admin || admin.role !== 'admin') throw new Error('The configured ADMIN_EMAIL must already belong to a seeded admin account.')

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const items = []
      for (const sample of samples) {
        const owner = sample.owner === 'admin' ? admin : student
        const date = new Date(today.getTime() - sample.daysAgo * 86400000)
        const item = await Item.findOneAndUpdate(
          { title: sample.title },
          { $set: { type: sample.type, title: sample.title, description: sample.description, category: sample.category, location: sample.location, date, imageUrl: null, contactName: owner.name, contactEmail: owner.email, postedBy: owner._id, status: 'active' } },
          { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
        )
        items.push(item)
      }

      const claimSpecs = [
        { item: items[12], claimant: student, status: 'approved', identifyingDetails: 'The wallet contains a small brass key and a folded blue library receipt.', ownershipReason: 'I can identify the initials embossed inside the wallet and list its contents.' },
        { item: items[13], claimant: student, status: 'rejected', identifyingDetails: 'The charger has a small strip of green tape near the connector.', ownershipReason: 'I can describe the laptop model and the charger label that matches it.' },
        { item: items[4], claimant: admin, status: 'pending', identifyingDetails: 'The calculator has a tiny scratch beside the mode button.', ownershipReason: 'I can identify the model and the initials written inside its battery cover.' },
        { item: items[5], claimant: admin, status: 'rejected', identifyingDetails: 'The notebook has a torn page near the final chapter.', ownershipReason: 'I can describe the course notes and the color of the bookmark inside.' },
      ]
      const retainedClaimIds = []
      for (const spec of claimSpecs) {
        const claim = await Claim.findOneAndUpdate(
          { itemId: spec.item._id, createdBy: spec.claimant._id },
          { $set: { itemId: spec.item._id, createdBy: spec.claimant._id, claimantName: spec.claimant.name, claimantEmail: spec.claimant.email, status: spec.status, identifyingDetails: spec.identifyingDetails, ownershipReason: spec.ownershipReason } },
          { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
        )
        retainedClaimIds.push(claim._id)
      }
      const sampleItemIds = items.map((item) => item._id)
      await Claim.deleteMany({ itemId: { $in: sampleItemIds }, _id: { $nin: retainedClaimIds } })
      await Item.updateOne({ _id: items[12]._id }, { $set: { status: 'recovered' } })
      await Item.updateOne({ _id: items[13]._id }, { $set: { status: 'active' } })
      await Item.updateOne({ _id: items[4]._id }, { $set: { status: 'claim_pending' } })
      await Item.updateOne({ _id: items[5]._id }, { $set: { status: 'active' } })
      process.stdout.write('Sample data seeded: 14 items and 4 claims.\n')
    } catch (error) {
      process.stderr.write(`${error.message}\n`)
      process.exitCode = 1
    } finally {
      const mongoose = await import('mongoose')
      await mongoose.default.disconnect()
    }
  }
}
