import { NavLink } from 'react-router-dom'

const VIEWS = [
  { to: '/cohub', label: 'רשימה' },
  { to: '/cohub/calendar', label: 'לוח שנה' },
]

// List / calendar switch for the projects screens.
export function ProjectsViewToggle() {
  return (
    <nav className="flex gap-1 px-4 pt-3" aria-label="תצוגה">
      {VIEWS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `px-2 py-0.5 text-sm font-medium border ${
              isActive ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
