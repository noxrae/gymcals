import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { IconBolt, IconCalendar, IconChevronLeft, IconHome, IconPlusCircle, IconTrend } from './Icons'

const TABS = [
  { to: '/', label: 'Today', Icon: IconHome },
  { to: '/plan', label: 'Plan', Icon: IconCalendar },
  { to: '/progress', label: 'Progress', Icon: IconTrend },
  { to: '/skills', label: 'Skills', Icon: IconBolt },
  { to: '/log', label: 'Log', Icon: IconPlusCircle },
]

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
          {({ isActive }) => (
            <>
              <Icon filled={isActive} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function NavBar({ title, back = 'Back', end }: { title?: string; back?: string; end?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="navbar">
      <button type="button" className="back" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>
        <IconChevronLeft />
        {back}
      </button>
      <span className="title">{title}</span>
      <span className="end">{end}</span>
    </header>
  )
}

/** Round translucent back button for screens with a full-bleed photo header. */
export function FloatingBack({ label = 'Back' }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 14px)', left: 16, zIndex: 2 }}
      onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}
    >
      <IconChevronLeft size={18} />
    </button>
  )
}

/** Renders fixed-position UI at the document root, so screen transitions never move it. */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <Portal>
      <div className="bottom-bar">{children}</div>
    </Portal>
  )
}

export function Sheet({ onClose, children, label }: { onClose: () => void; children: ReactNode; label: string }) {
  return (
    <Portal>
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
          <div className="grabber" />
          {children}
        </div>
      </div>
    </Portal>
  )
}
