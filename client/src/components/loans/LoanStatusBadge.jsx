import { Badge } from '../ui/Badge'

const loanTones = {
  Pending: 'amber',
  Active: 'teal',
  Completed: 'navy',
  Overdue: 'rose',
  Cancelled: 'slate',
}

const instalmentTones = {
  Unpaid: 'slate',
  Partial: 'amber',
  Paid: 'teal',
  Advance: 'navy',
}

export function LoanStatusBadge({ status }) {
  return <Badge tone={loanTones[status] ?? 'slate'}>{status}</Badge>
}

export function InstalmentStatusBadge({ status }) {
  return <Badge tone={instalmentTones[status] ?? 'slate'}>{status}</Badge>
}
