import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createApp } from './app.js'

async function withServer(run) {
  const app = createApp()
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')

  try {
    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Test server did not bind to a port.')
    }
    await run(address.port)
  } finally {
    server.closeAllConnections?.()
    server.close()
    await once(server, 'close')
  }
}

test('GET /api/health reports the API without a database', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.status, 'ok')
    assert.equal(body.service, 'saaj-api')
    assert.equal(body.database, 'not_connected')
    assert.equal(typeof body.time, 'string')
  })
})

test('unknown API routes return JSON 404', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/loans`)
    const body = await response.json()

    assert.equal(response.status, 404)
    assert.equal(body.error.message, 'Resource not found')
  })
})
