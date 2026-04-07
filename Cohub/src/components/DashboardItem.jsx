// src/components/DashboardItem.jsx
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { isOverdue, formatDateHe } from '../utils/dates'
import { Tag } from './ui/tag'

export function DashboardItem({ item, course }) {
  const overdue = isOverdue(item.dueDate)
  const isMilestone = Boolean(item.projectTitle)

  return (
    <Link
      to={`/projects/${item.projectId}`}
      className={`list-row-stacked ${overdue ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-0 overflow-hidden min-w-0">
          {isMilestone ? (
            <>
              <strong className="font-display font-bold text-base text-foreground whitespace-nowrap shrink-0">
                {item.projectTitle}
              </strong>
              <p className="mx-1.5 text-sm shrink-0 text-muted-foreground">›</p>
              <p className="text-base text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {item.title}
              </p>
            </>
          ) : (
            <strong className="font-display font-bold text-base text-foreground">
              {item.title}
            </strong>
          )}
        </div>
        {course && <Tag value={course.name} color={course.color} />}
      </div>
      <p className={`flex gap-1 items-center text-sm ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Calendar className="size-3" />
        {formatDateHe(item.dueDate)}
      </p>
    </Link>
  )
}
