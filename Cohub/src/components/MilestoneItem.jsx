import { Link } from 'react-router-dom'
import { Tag } from './ui/tag'
import { isOverdue, formatDateHe } from '../utils/dates'
import { Calendar, GraduationCap } from 'lucide-react'

export function MilestoneItem({ milestone, course }) {
  const overdue = isOverdue(milestone.dueDate)

  return (
    <Link
      to={`/projects/${milestone.projectId}`}
      data-overdue={overdue ? 'true' : undefined}
      className={`list-row-stacked ${overdue ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-medium text-foreground">{milestone.title}</span>
              <Tag value={course.name} color={course.color} to={`/courses/${course.id}`} />

      </div>
      <div className="text-sm text-muted-foreground">{milestone.projectTitle}</div>
      <div className={`flex gap-1 items-center text-sm ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Calendar className='size-3'/>
        {formatDateHe(milestone.dueDate)}
      </div>
    </Link>
  )
}
