import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge'

export function CourseListItem({ course, aggregate }) {
  const statsText = aggregate.count === 0
    ? 'אין דירוגים עדיין'
    : `${aggregate.recommendPercent}% ממליצים · ${aggregate.count} דירוגים`

  return (
    <Link to={`/catalog/${course.id}`} className="list-row-stacked block">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{course.name}</span>
        <Badge variant="muted">{course.category}</Badge>
      </div>
      <div className="text-base text-muted-foreground">{course.lecturer}</div>
      <div className="text-sm text-muted-foreground">{statsText}</div>
    </Link>
  )
}
