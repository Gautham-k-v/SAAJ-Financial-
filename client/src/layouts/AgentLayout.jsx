import { ClipboardList, History, Home, UserRound, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const items = [
  { to: '/agent/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/agent/collections', label: 'Collections', icon: ClipboardList },
  { to: '/agent/customers', label: 'Customers', icon: Users },
  { to: '/agent/history', label: 'History', icon: History },
  { to: '/agent/profile', label: 'Profile', icon: UserRound },
]

export default function AgentLayout() {
  return (
    <div className="min-h-svh bg-canvas">
      <div className="mx-auto min-h-svh max-w-2xl px-4 pb-32 pt-5">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white" aria-label="Field">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? 'text-teal-800' : 'text-slate-500'}`
                }
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
