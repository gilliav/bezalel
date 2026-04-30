import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'פרויקטים' },
  { to: '/courses', label: 'קורסים' },
  { to: '/schedule', label: 'מערכת שעות' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 right-0 left-0 flex bg-card border-t border-border">
      {TABS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 py-3 text-center bg-card text-base font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`
          }
        >
          {label}

          
        </NavLink>
      ))}
    </nav>
  )
}
