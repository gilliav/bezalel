import { Circle, Clock, CheckCircle, LogIn } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

const CONFIG = {
  not_started: {
    icon: Circle,
    label: 'לא התחלתי',
    pillClass: 'pill pill-muted',
    style: {},
  },
  in_progress: {
    icon: Clock,
    label: 'בתהליך',
    pillClass: 'pill',
    style: {
      backgroundColor: 'rgb(251 191 36 / 0.15)',
      color: 'rgb(217 119 6)',
      borderColor: 'rgb(217 119 6 / 0.4)',
    },
  },
  done: {
    icon: CheckCircle,
    label: 'סיימתי',
    pillClass: 'pill',
    style: {
      backgroundColor: 'rgb(22 163 74 / 0.12)',
      color: 'rgb(22 163 74)',
      borderColor: 'rgb(22 163 74 / 0.4)',
    },
  },
}

const STATUSES = ['not_started', 'in_progress', 'done']

// Props:
// - status: 'not_started' | 'in_progress' | 'done' (default: 'not_started')
// - onSelect: (newStatus) => void — when user is signed in
// - onSignInPrompt: () => void — when user is signed out
export function ProgressIndicator({ status = 'not_started', onSelect, onSignInPrompt }) {
  const isLoggedOut = !onSelect
  const { icon: Icon, label, pillClass, style } = CONFIG[status] ?? CONFIG['not_started']

  if (isLoggedOut) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          onSignInPrompt?.()
        }}
        className="pill pill-muted"
        title="התחבר כדי לעקוב אחרי ההתקדמות שלך"
        aria-label="התחבר כדי לעקוב אחרי ההתקדמות שלך"
      >
        <LogIn size={12} className="ms-0.5 me-1" />
        התחבר למעקב
      </button>
    )
  }

  return (
    <Select
      value={status}
      onValueChange={(val) => onSelect(val)}
      dir="rtl"
    >
      <SelectTrigger
        className={`${pillClass} border-0 h-auto min-h-0 py-0.5 px-2 focus:ring-0 focus:ring-offset-0 w-auto gap-1 [&>span:last-child]:hidden`}
        style={style}
        onClick={(e) => e.preventDefault()}
      >
        <Icon size={12} className="shrink-0" />
        <span>{label}</span>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => {
          const { icon: SIcon, label: sLabel } = CONFIG[s]
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <SIcon size={13} />
                {sLabel}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
