import { config } from 'dotenv'

config({ quiet: true })

function read(name, fallback) {
  const value = process.env[name]
  if (value === undefined || value.trim() === '') return fallback
  return value.trim()
}

const port = Number(read('PORT', '5050'))

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('PORT must be a positive integer.')
}

export const env = {
  nodeEnv: read('NODE_ENV', 'development'),
  port,
  clientOrigin: read('CLIENT_ORIGIN', 'http://localhost:5173'),
}
