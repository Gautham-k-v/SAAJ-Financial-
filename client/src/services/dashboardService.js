import { getDashboardSnapshot } from './collectionService.js'

const PREVIEW_DELAY_MS = 300

/**
 * Dashboard figures come from the same loan and payment records as Daily Collections.
 * The short delay exists so the loading state can be reviewed.
 */
export function getDashboardOverview() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getDashboardSnapshot())
    }, PREVIEW_DELAY_MS)
  })
}
