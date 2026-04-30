import { Link } from 'react-router-dom'
import { UrgencyPill } from './UrgencyPill'
import { CourseTag } from './CourseTag'
import { formatRelativeDateHe } from '../utils/dates'

function pillVariant(dueDate) {
  if (!dueDate) return 'muted'
  const date = dueDate.toDate()
  if (date < new Date()) return 'danger'
  const daysUntil = (date - new Date()) / 86_400_000
  return daysUntil <= 7 ? 'dark' : 'muted'
}

function formatIndex(n) {
  return String(n).padStart(2, '0')
}

export function ProjectRow({ project, course, nextMilestone }) {
  const dueDate = nextMilestone ? nextMilestone.dueDate : project.dueDate
  const label = formatRelativeDateHe(dueDate)
  const variant = pillVariant(dueDate)

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block relative border-b"
      style={{ borderColor: 'rgba(26,23,20,0.09)' }}
    >
      {/* Color accent stripe */}
      <div
        className="absolute top-0 right-0 w-1 h-full"
        style={{ background: course?.color }}
      />

      {/* Main row */}
      <div className="flex items-baseline justify-between gap-2 px-4 pt-2.5 pb-1 pr-5">
        <div className="flex items-baseline gap-0 overflow-hidden min-w-0">
          <span className="font-display font-bold text-base text-foreground whitespace-nowrap shrink-0">
            {project.title}
          </span>
          {nextMilestone && (
            <>
              <span className="mx-1.5 text-sm shrink-0" style={{ color: 'rgba(26,23,20,0.22)' }}>›</span>
              <span className="font-display font-bold text-base text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {formatIndex(nextMilestone.index)} {nextMilestone.title}
              </span>
            </>
          )}
        </div>
        <UrgencyPill label={label} variant={variant} />
      </div>

      {/* Course tag line */}
      <div className="px-4 pb-2.5 pr-5">
        <CourseTag
          name={course?.name}
          color={course?.color}
        />
      </div>
    </Link>
  )
}
