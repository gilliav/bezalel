import { Link } from 'react-router-dom'
import { ThumbsUp, Star } from 'lucide-react'
import { formatRatingCount } from '../../utils/catalogAggregate'

export function CourseListItem({ course, aggregate }) {
  return (
    <Link
      to={`/catalog/${course.id}`}
      className="flex flex-col border border-border rounded-lg bg-card px-6 py-4 "
    >
      <div className="text-base text-muted-foreground">{course.lecturer}</div>
      <span className="font-semibold text-foreground block leading-none mb-2">{course.name}</span>

      <div className="flex items-center gap-3 text-sm mt-auto">
        <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--rating-positive)' }}>
          <ThumbsUp size={14} />
          {aggregate.recommendPercent !== null ? `${aggregate.recommendPercent}%` : '--'}
        </span>
        <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--rating-star)' }}>
          <Star size={14} fill="currentColor" />
          {aggregate.profGood !== null ? aggregate.profGood.toFixed(1) : '--'}
        </span>
        <span className="text-muted-foreground">({formatRatingCount(aggregate.count)})</span>
      </div>
    </Link>
  )
}
