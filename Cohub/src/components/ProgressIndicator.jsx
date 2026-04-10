import { Circle, Clock, CheckCircle } from 'lucide-react'

const CONFIG = {
  not_started: {
    icon: Circle,
    className: 'text-muted-foreground opacity-30',
    label: 'לא התחלתי',
  },
  in_progress: {
    icon: Clock,
    className: 'text-amber-500',
    label: 'בתהליך',
  },
  done: {
    icon: CheckCircle,
    className: 'text-green-600',
    label: 'סיימתי',
  },
}

// Props:
// - status: 'not_started' | 'in_progress' | 'done' (default: 'not_started')
// - onCycle: () => void — when user is signed in; clicking advances status
// - onSignInPrompt: () => void — when user is signed out; clicking triggers sign-in
export function ProgressIndicator({ status = 'not_started', onCycle, onSignInPrompt }) {
  const isLoggedOut = !onCycle
  const { icon: Icon, className, label } = CONFIG[status] ?? CONFIG['not_started']

  function handleClick(e) {
    e.preventDefault() // prevent Link navigation from parent DashboardItem
    if (isLoggedOut) {
      if (onSignInPrompt) {
        onSignInPrompt()
      } else {
        console.warn('ProgressIndicator: onSignInPrompt is not provided in logged-out mode')
      }
    } else {
      onCycle()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isLoggedOut ? 'התחבר כדי לעקוב אחרי ההתקדמות שלך' : label}
      className={`flex items-center justify-center p-1 rounded transition-opacity hover:opacity-80 ${className}`}
      aria-label={isLoggedOut ? 'התחבר כדי לעקוב אחרי ההתקדמות שלך' : label}
    >
      <Icon size={18} />
    </button>
  )
}
