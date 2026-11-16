import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { SaajWordmark } from '../brand/SaajMark'
import { NotificationMenu } from '../notifications/NotificationMenu'
import { IconButton } from '../ui/IconButton'
import { formatLongDate } from '../../utils/datetime'

export function Topbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  return (
    <header className="saaj-app-chrome sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <div className="lg:hidden">
          <IconButton label="Open menu" onClick={onOpenMobile}>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="hidden lg:block">
          <IconButton
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
            )}
          </IconButton>
        </div>
        <div className="lg:hidden">
          <SaajWordmark />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <p className="hidden text-sm font-medium text-slate-500 md:block">{formatLongDate()}</p>
        <NotificationMenu />
        <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-xs font-semibold text-white">
            AD
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium text-navy-900">Admin</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
