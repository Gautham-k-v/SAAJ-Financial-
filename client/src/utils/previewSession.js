const STORAGE_KEY = 'saaj.preview.admin'

function storage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Temporary gate so the dashboard can be reviewed before session authentication exists.
 * It does not identify an admin and must be replaced by the server session.
 */
export function hasPreviewSession() {
  return storage()?.getItem(STORAGE_KEY) === '1'
}

export function startPreviewSession() {
  storage()?.setItem(STORAGE_KEY, '1')
}

export function endPreviewSession() {
  storage()?.removeItem(STORAGE_KEY)
}
