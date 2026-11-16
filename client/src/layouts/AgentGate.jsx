import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { endAgentSession } from '../services/access'
import { confirmAgent } from '../services/authService'

export default function AgentGate() {
  const [state, setState] = useState('checking')

  useEffect(() => {
    let active = true
    confirmAgent()
      .then(() => {
        if (active) setState('ready')
      })
      .catch(() => {
        endAgentSession()
        if (active) setState('denied')
      })
    return () => {
      active = false
    }
  }, [])

  if (state === 'checking') {
    return (
      <div className="grid min-h-svh place-items-center bg-canvas px-6 text-sm text-slate-500" aria-busy="true">
        Checking the field session
      </div>
    )
  }

  if (state === 'denied') return <Navigate to="/agent/login" replace />
  return <Outlet />
}
