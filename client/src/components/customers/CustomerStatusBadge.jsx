import { Badge } from '../ui/Badge'

export function CustomerStatusBadge({ status }) {
  return <Badge tone={status === 'Active' ? 'teal' : 'slate'}>{status}</Badge>
}
