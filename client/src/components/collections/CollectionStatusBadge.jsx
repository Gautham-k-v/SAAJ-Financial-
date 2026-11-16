import { Badge } from '../ui/Badge'

const tones = {
  Paid: 'teal',
  Partial: 'amber',
  Unpaid: 'slate',
  Overdue: 'rose',
}

export function CollectionStatusBadge({ status }) {
  return <Badge tone={tones[status] ?? 'slate'}>{status}</Badge>
}
