import { cn } from '../lib/utils'
import { courseIcon } from '../utils/courseIcons'

// Decorative subject icon for a course; the course name is always shown beside it.
// The SVG is used as a mask so it takes the course's color.
export function CourseIcon({ course, className, ...props }) {
  return (
    <span
      aria-hidden="true"
      className={cn('course-icon size-6', className)}
      style={{ '--icon': `url("${courseIcon(course)}")`, backgroundColor: course?.color ?? 'currentColor' }}
      {...props}
    />
  )
}
