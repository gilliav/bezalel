import { Square, SquareCheckBig, SquareDot } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

const CONFIG = {
  not_started: {
    icon: Square,
    label: 'חדש',
    pillClass: 'pill pill-muted',
    style: {},
  },
  in_progress: {
    icon: SquareDot,
    label: 'בתהליך',
    pillClass: 'pill',
    style: {
      color: 'rgb(217 119 6)',
    },
  },
  done: {
    icon: SquareCheckBig,
    label: 'סיימתי',
    pillClass: 'pill',
    style: {
      color: 'rgb(22 163 74)',
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
    return <></>
  }

  return (
    <Select
      value={status}
      onValueChange={(val) => onSelect(val)}
      dir="rtl"
    >
      <SelectTrigger
        className={`${pillClass} border-0 h-auto min-h-0 py-0.5 px-2 w-auto gap-1 [&>span:last-child]:hidden hover:opacity-70 transition-all`}
        style={style}
        onClick={(e) => e.preventDefault()}
      >
        <Icon size={16} className="shrink-0" />
        <span>{label}</span>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => {
          const { icon: SIcon, label: sLabel } = CONFIG[s]
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <SIcon size={16} />
                {sLabel}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
