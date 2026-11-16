import { apiClient } from '../api/client.js'
import { endPreviewSession } from '../utils/previewSession.js'
import { actor, endAgentSession, saveAgentSession } from './access.js'
import { authenticateDevelopmentAgent, getStoredAgent } from './agentService.js'

export async function signInAgent(identifier, password) {
  try {
    const { data } = await apiClient.post('/auth/login', { identifier, password })
    if (data.role !== 'agent') {
      await apiClient.post('/auth/logout').catch(() => {})
      endAgentSession()
      throw new Error('This sign-in is for collection agents.')
    }
    const directory = getStoredAgent(data.accountId)
    if (directory?.status === 'Inactive') {
      await apiClient.post('/auth/logout').catch(() => {})
      endAgentSession()
      throw new Error('This agent is inactive. Ask an administrator to activate the account.')
    }
    endPreviewSession()
    saveAgentSession(data)
    return data
  } catch (error) {
    if (error?.message?.startsWith('This ')) throw error
    const local = authenticateDevelopmentAgent(identifier, password)
    if (local) {
      endPreviewSession()
      const session = {
        role: 'agent',
        accountId: local.id,
        name: local.name,
        email: local.email,
        phone: local.phone,
        token: `development:${local.id}`,
      }
      saveAgentSession(session)
      return session
    }
    if (!error.response || error.response.status === 401) {
      throw new Error('The email, username, or password is not recognised.')
    }
    throw error
  }
}

export async function confirmAgent() {
  const current = actor()
  if (current.role === 'agent' && String(current.token).startsWith('development:')) {
    const agent = getStoredAgent(current.accountId)
    if (!agent || agent.status === 'Inactive' || agent.authMode !== 'development') {
      throw new Error('This development session is no longer active.')
    }
    saveAgentSession({ ...current, name: agent.name, email: agent.email, phone: agent.phone })
    return agent
  }

  const { data } = await apiClient.get('/auth/me')
  if (data.role !== 'agent') throw new Error('This session is not a collection agent.')
  const directory = getStoredAgent(data.accountId)
  if (directory?.status === 'Inactive') throw new Error('This agent is inactive.')
  saveAgentSession({ ...data, token: actor().token })
  return data
}

export async function signOutAgent() {
  await apiClient.post('/auth/logout').catch(() => {})
  endAgentSession()
}
