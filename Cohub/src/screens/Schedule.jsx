import { useCourses } from '../hooks/useCourses'
import { PageHeader } from '../components/PageHeader'
import { SectionTier } from '../components/SectionTier'
import { EmptyState } from '../components/EmptyState'

const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']

export default function Schedule() {
  const { courses, loading } = useCourses()

  if (loading) return <div className="state-loading">טוען...</div>

  const regularCourses = courses.filter(c => !c.isOnline)
  const onlineCourses = courses.filter(c => c.isOnline)

  const byDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = regularCourses.filter(c => c.day === day)
    return acc
  }, {})

  const hasAny = DAY_ORDER.some(day => byDay[day].length > 0) || onlineCourses.length > 0

  return (
    <div className="text-right">
      <PageHeader title="מערכת שעות" />
      {!hasAny && <EmptyState message="אין קורסים" />}
      {DAY_ORDER.map(day => {
        const dayCourses = byDay[day]
        if (!dayCourses.length) return null
        return (
          <div key={day}>
            <SectionTier label={day} variant="normal" />
            {dayCourses.map(course => (
              <div key={course.id} className="list-row items-start">
                <div className="color-dot mt-0.5" style={{ backgroundColor: course.color }} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-medium text-foreground">{course.name}</span>
                  <span className="text-sm text-muted-foreground">{course.hours} · {course.location}</span>
                  <span className="text-sm text-muted-foreground">{course.lecturer}</span>
                  {course.notes && (
                    <span className="text-sm text-muted-foreground">{course.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
      {onlineCourses.length > 0 && (
        <div>
          <SectionTier label="אונליין" variant="normal" />
          {onlineCourses.map(course => (
            <div key={course.id} className="list-row items-start">
              <div className="color-dot mt-0.5" style={{ backgroundColor: course.color }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-medium text-foreground">{course.name}</span>
                <span className="text-sm text-muted-foreground">קורס מקוון · {course.lecturer}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
