import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  Landmark,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { SaajWordmark, SaajMark } from '../brand/SaajMark'
import { IconButton } from '../ui/IconButton'
import { adminNavigation } from '../../config/navigation'
import { previewChrome } from '../../data/previewChrome'
import { endAgentSession } from '../../services/access'
import { endPreviewSession } from '../../utils/previewSession'

const icons = {
  dashboard: LayoutDashboard,
  customers: Users,
  loans: Landmark,
  collections: CalendarCheck,
  transactions: ArrowLeftRight,
  ledger: BookOpen,
  agents: UserCog,
  reports: BarChart3,
  notifications: Bell,
  audit: ScrollText,
  settings: Settings,
}

export function Sidebar({ collapsed, mobileOpen, onNavigate }) {
  return (
    <>
      <div
        className={`saaj-app-chrome fixed inset-y-0 left-0 z-40 hidden transition-[width] lg:block ${
          collapsed ? 'w-[4.75rem]' : 'w-64'
        }`}
      >
        <SidebarPanel collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <button
        type="button"
        aria-label="Close menu"
        onClick={onNavigate}
        className={`saaj-app-chrome fixed inset-0 z-40 bg-navy-950/50 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`}
      />

      <div
        className={`saaj-app-chrome fixed inset-y-0 left-0 z-50 w-64 transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
        inert={!mobileOpen ? true : undefined}
        aria-hidden={mobileOpen ? undefined : true}
      >
        <SidebarPanel collapsed={false} onNavigate={onNavigate} />
      </div>
    </>
  )
}

function SidebarPanel({ collapsed, onNavigate }) {
  const navigate = useNavigate()

  function logout() {
    endPreviewSession()
    endAgentSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col bg-navy-950 px-3 py-4 text-white">
      <div className={`flex shrink-0 items-center px-1 ${collapsed ? 'justify-center' : ''}`}>
        {collapsed ? <SaajMark tone="teal" /> : <SaajWordmark light markTone="teal" />}
      </div>

      <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Primary">
        {adminNavigation.map((group, groupIndex) => (
          <div key={group.id}>
            {collapsed ? (
              groupIndex > 0 ? <div className="mx-2 my-3 h-px bg-white/10" /> : null
            ) : (
              <p
                className={`px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 ${
                  groupIndex === 0 ? 'pt-1' : 'pt-4'
                }`}
              >
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = icons[item.icon]
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center rounded-lg py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                      } ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-teal-300' : ''}`}
                          aria-hidden="true"
                        />
                        {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {collapsed ? (
        <div className="mt-4 flex shrink-0 flex-col items-center gap-3 border-t border-white/10 pt-4">
          <div
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-semibold"
            title={previewChrome.operatorLabel}
          >
            {previewChrome.initials}
          </div>
          <IconButton label="Log out" tone="dark" onClick={logout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      ) : (
        <div className="mt-4 flex shrink-0 items-center gap-3 border-t border-white/10 pt-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">
            {previewChrome.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{previewChrome.operatorLabel}</p>
            <p className="truncate text-xs text-slate-400">{previewChrome.roleLabel}</p>
          </div>
          <IconButton label="Log out" tone="dark" onClick={logout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
