import { asyncHandler } from '../utils/asyncHandler.js'

export const getHealth = asyncHandler(async (_req, res) => {
  res.json({
    status: 'ok',
    service: 'saaj-api',
    database: 'not_connected',
    time: new Date().toISOString(),
  })
})
