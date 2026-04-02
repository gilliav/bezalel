import { Link } from 'react-router-dom'
import { isOverdue, formatDateHe } from '../utils/dates'

export function MilestoneItem({ milestone, course }) {
  const overdue = isOverdue(milestone.dueDate)

  return (
    <Link
      to={`/projects/${milestone.projectId}`}
      data-overdue={overdue ? 'true' : undefined}
      className={`block px-4 py-3 border-b border-gray-100 ${overdue ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-900">{milestone.title}</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full text-white shrink-0"
          style={{ backgroundColor: course?.color }}
        >
          {course?.name}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{milestone.projectTitle}</div>
      <div className={`text-xs mt-0.5 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
        {formatDateHe(milestone.dueDate)}
      </div>
    </Link>
  )
}
