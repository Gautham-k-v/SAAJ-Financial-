export const adminNavigation = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        description: 'Daily collection position, receipts, and overdue alerts.',
      },
    ],
  },
  {
    id: 'book',
    label: 'Book',
    items: [
      {
        to: '/customers',
        label: 'Customers',
        icon: 'customers',
        description: 'Customer records for the lending book.',
      },
      {
        to: '/loans',
        label: 'Loans',
        icon: 'loans',
        description: 'Daily repayment loans and their schedules.',
      },
      {
        to: '/collections',
        label: 'Daily Collections',
        icon: 'collections',
        description: 'The instalments due on the current round.',
      },
      {
        to: '/transactions',
        label: 'Transactions',
        icon: 'transactions',
        description: 'Posted payment transactions and receipt numbers.',
      },
      {
        to: '/ledger',
        label: 'Customer Ledger',
        icon: 'ledger',
        description: 'Customer-wise balances and payment history.',
      },
    ],
  },
  {
    id: 'field',
    label: 'Field',
    items: [
      {
        to: '/agents',
        label: 'Collection Agents',
        icon: 'agents',
        description: 'Agents assigned to collection routes.',
      },
    ],
  },
  {
    id: 'insight',
    label: 'Insight',
    items: [
      {
        to: '/reports',
        label: 'Reports',
        icon: 'reports',
        description: 'Collection, outstanding, and performance reports.',
      },
      {
        to: '/notifications',
        label: 'Notifications',
        icon: 'notifications',
        description: 'Operational alerts for the lending desk.',
      },
      {
        to: '/audit-logs',
        label: 'Audit Logs',
        icon: 'audit',
        description: 'A record of important administrative actions.',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        to: '/settings',
        label: 'Settings',
        icon: 'settings',
        description: 'Workspace preferences for the SAAJ desk.',
      },
    ],
  },
]

export const adminNavItems = adminNavigation.flatMap((group) => group.items)
