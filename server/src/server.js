import { createApp } from './app.js'
import { validateEnv } from './config/env.js'
import { connectDatabase } from './config/db.js'

async function start() {
  let config
  try { config = validateEnv() } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exit(1)
  }
  try {
    await connectDatabase(config.mongoUri)
  } catch (error) {
    process.stderr.write('Could not connect to MongoDB. Check the URI, database credentials, and Atlas network access.\n')
    process.exit(1)
  }
  const app = createApp({ clientUrls: config.clientUrls })
  const server = app.listen(config.port, () => process.stdout.write(`Campus Loop API listening on port ${config.port}\n`))
  const shutdown = async () => {
    server.close(async () => {
      const mongoose = await import('mongoose')
      await mongoose.default.disconnect()
      process.exit(0)
    })
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start()
