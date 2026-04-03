import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'פרויקטים' },
  { to: '/courses', label: 'קורסים' },
  { to: '/schedule', label: 'מערכת שעות' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 flex">
      {TABS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-sm font-medium ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
