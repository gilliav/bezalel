import { Link } from 'react-router-dom'
import { ThumbsUp, Star } from 'lucide-react'
import { formatRatingCount } from '../../utils/catalogAggregate'

export function CourseListItem({ course, aggregate }) {
  return (
    <Link
      to={`/catalog/${course.id}`}
      className="flex flex-col border border-border rounded-lg bg-card px-6 py-4 "
    >
      <div className="text-sm text-muted-foreground mb-0.5">{course.lecturer}</div>
      <span className="font-display text-base text-foreground block leading-none mb-4">{course.name}</span>

      <div className="flex items-center gap-3 text-sm mt-auto">
        <span className="flex items-center gap-1">
          <ThumbsUp size={14} fill="var(--rating-positive)" strokeWidth={0}/>
          {aggregate.recommendPercent !== null ? `${aggregate.recommendPercent}%` : '--'}
        </span>
        <span className="flex items-center gap-1">
          <Star size={14} fill="var(--rating-star)" strokeWidth={0} />
          {aggregate.profGood !== null ? aggregate.profGood.toFixed(1) : '--'}
        </span>
        <span className="text-muted-foreground">({aggregate.count} דירוגים)</span>
      </div>
    </Link>
  )
}
