import { Link } from 'react-router-dom'
import { ThumbsUp, Star } from 'lucide-react'
import { Badge } from '../ui/badge'

export function CourseListItem({ course, aggregate }) {
  return (
    <Link
      to={`/catalog/${course.id}`}
      className="block border border-border rounded-lg bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">{course.name}</span>
        <Badge variant="muted">{course.category}</Badge>
      </div>
      <div className="text-base text-muted-foreground">{course.lecturer}</div>

      {aggregate.count === 0 ? (
        <div className="text-sm text-muted-foreground mt-1">אין דירוגים עדיין</div>
      ) : (
        <div className="flex items-center gap-3 mt-1 text-sm">
          <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--rating-positive)' }}>
            <ThumbsUp size={14} />
            {aggregate.recommendPercent}%
          </span>
          {aggregate.profGood !== null && (
            <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--rating-star)' }}>
              <Star size={14} fill="currentColor" />
              {aggregate.profGood.toFixed(1)}
            </span>
          )}
          <span className="text-muted-foreground">· {aggregate.count} דירוגים</span>
        </div>
      )}
    </Link>
  )
}
