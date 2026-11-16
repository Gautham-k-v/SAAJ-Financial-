import { Navigate, Outlet } from 'react-router-dom'
import { hasAgentSession } from '../services/access'
import { hasPreviewSession } from '../utils/previewSession'

export default function PreviewGate() {
  if (!hasPreviewSession()) {
    return <Navigate to={hasAgentSession() ? '/agent/dashboard' : '/login'} replace />
  }

  return <Outlet />
}
