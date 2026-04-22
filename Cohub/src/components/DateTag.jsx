import { AlarmCheck, Bird, CalendarRangeIcon, ChevronFirstIcon, ChevronLeft, ChevronsLeft, ChevronsLeftIcon, ChevronsLeftRight, ChevronsLeftRightEllipsis, CircleChevronLeft, Clock, Clock3, ClockFadingIcon, DotIcon, Gauge, LucideCalendarClock, LucideCircleChevronUp, Minus, TimerIcon, Calendar, Timer } from 'lucide-react';
import { cn } from '../lib/utils'
import { formatDateShort, formatRelativeDateHe, isOverdue } from '../utils/dates'

export function DateTag({ dueDate, className, includeRelative = false, mode = 'vertical' }) {
  const overdue = isOverdue(dueDate)
  const base = `flex px-1 ${mode === "vertical" ? "flex-col gap-0" : "gap-2"}`;

  const color = overdue ? 'bg-destructive/10 text-destructive' : 'text-foreground'
  return (
    <div className={cn(base, color, className)}>
      <div className={cn(`flex ${mode === "vertical" ? "flex-row-reverse" : ""} gap-1 items-center`)}>
        <Calendar className="size-2.5" />
        <p className="text-sm leading-none">{formatDateShort(dueDate)}</p>
      </div>
      {includeRelative && (
        <>
          <div className={cn(`flex ${mode === "vertical" ? "flex-row-reverse" : ""} gap-1 items-center `)}>
            <Timer className="text-foreground size-3 mx-[-1px]" />
            <p className={cn('text-sm', overdue ? 'text-destructive/70' : 'text-foreground')}>
              {formatRelativeDateHe(dueDate)}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
