import { formatDateHe, isOverdue } from '../../utils/dates'

export function TimelineMilestone({ milestone }) {
  const overdue = isOverdue(milestone.dueDate)
  return (
    <div className="flex items-start gap-3 pe-6 py-2">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${overdue ? 'bg-destructive' : 'bg-border'}`} />
      <div className="flex flex-col gap-0.5">
        <span className={`text-base ${overdue ? 'text-destructive' : 'text-foreground'}`}>
          {milestone.title}
        </span>
        <span className="text-sm text-muted-foreground">{formatDateHe(milestone.dueDate)}</span>
      </div>
    </div>
  )
}
