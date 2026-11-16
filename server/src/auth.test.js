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
    if (!address || typeof address === 'string') throw new Error('Test server did not bind to a port.')
    await run(address.port)
  } finally {
    server.closeAllConnections?.()
    server.close()
    await once(server, 'close')
  }
}

async function login(port, identifier, password) {
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  const body = await response.json()
  return { response, body }
}

test('an agent signs in with a username or email and receives an agent session', async () => {
  await withServer(async (port) => {
    const username = await login(port, 'karthik', 'Fieldbook-01')
    assert.equal(username.response.status, 200)
    assert.equal(username.body.role, 'agent')
    assert.equal(username.body.accountId, 'AGT-01')
    assert.equal(username.body.name, 'Karthik Rajan')
    assert.equal(typeof username.body.token, 'string')

    const email = await login(port, 'divya.mohan@saaj.example', 'Fieldbook-02')
    assert.equal(email.response.status, 200)
    assert.equal(email.body.accountId, 'AGT-02')

    const rejected = await login(port, 'karthik', 'wrong-password')
    assert.equal(rejected.response.status, 401)
  })
})

test('a forgotten password is accepted without changing the account', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'karthik' }),
    })
    const body = await response.json()
    assert.equal(response.status, 202)
    assert.equal(body.mode, 'development')

    const stillValid = await login(port, 'karthik', 'Fieldbook-01')
    assert.equal(stillValid.response.status, 200)
  })
})

test('agent sessions are refused on administrator routes', async () => {
  await withServer(async (port) => {
    const agent = await login(port, 'karthik', 'Fieldbook-01')
    const admin = await login(port, 'admin@saaj.example', 'Fieldbook-admin')
    const paths = [
      ['POST', '/api/admin/loans'],
      ['POST', '/api/admin/agents'],
      ['GET', '/api/admin/reports'],
      ['DELETE', '/api/admin/transactions/TXN-1001'],
    ]

    for (const [method, path] of paths) {
      const anonymous = await fetch(`http://127.0.0.1:${port}${path}`, { method })
      assert.equal(anonymous.status, 401)

      const forbidden = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: { Authorization: `Bearer ${agent.body.token}` },
      })
      assert.equal(forbidden.status, 403)

      const allowed = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: { Authorization: `Bearer ${admin.body.token}` },
      })
      const body = await allowed.json()
      assert.equal(allowed.status, 200)
      assert.equal(body.allowed, true)
    }

    const me = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { Authorization: `Bearer ${agent.body.token}` },
    })
    const profile = await me.json()
    assert.equal(profile.role, 'agent')
    assert.equal(profile.phone, '9841011001')

    const signedOut = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent.body.token}` },
    })
    assert.equal(signedOut.status, 200)
    const after = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { Authorization: `Bearer ${agent.body.token}` },
    })
    assert.equal(after.status, 401)
  })
})
