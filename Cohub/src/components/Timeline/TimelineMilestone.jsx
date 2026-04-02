import { formatDateHe, isOverdue } from '../../utils/dates'

export function TimelineMilestone({ milestone }) {
  const overdue = isOverdue(milestone.dueDate)
  return (
    <div className="flex items-start gap-3 pr-6 py-2">
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${overdue ? 'bg-red-400' : 'bg-gray-300'}`} />
      <div>
        <div className={`text-sm ${overdue ? 'text-red-500' : 'text-gray-700'}`}>
          {milestone.title}
        </div>
        <div className="text-xs text-gray-400">{formatDateHe(milestone.dueDate)}</div>
      </div>
    </div>
  )
}
