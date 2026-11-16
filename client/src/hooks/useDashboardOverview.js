import { useCallback, useEffect, useRef, useState } from 'react'
import { getDashboardOverview } from '../services/dashboardService'
import { buildDashboardView } from '../utils/dashboardView'

export function useDashboardOverview() {
  const [requestKey, setRequestKey] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    data: null,
    error: '',
  })
  const requestId = useRef(0)

  useEffect(() => {
    const current = requestId.current + 1
    requestId.current = current

    getDashboardOverview()
      .then((payload) => {
        if (requestId.current !== current) return
        setState({
          status: 'ready',
          data: buildDashboardView(payload),
          error: '',
        })
      })
      .catch((error) => {
        if (requestId.current !== current) return
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'The dashboard could not be loaded.',
        })
      })
  }, [requestKey])

  const reload = useCallback(() => {
    setState({ status: 'loading', data: null, error: '' })
    setRequestKey((current) => current + 1)
  }, [])

  return { ...state, reload }
}
