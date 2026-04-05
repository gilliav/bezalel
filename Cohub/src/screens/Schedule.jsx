import { useCourses } from '../hooks/useCourses'

const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']

export default function Schedule() {
  const { courses, loading } = useCourses()

  if (loading) return <div className="state-loading">טוען...</div>

  const byDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = courses.filter(c => c.day === day)
    return acc
  }, {})

  return (
    <div className="text-right">
      <header className="page-header">
        <h1>מערכת שעות</h1>
      </header>
      {DAY_ORDER.map(day => {
        const dayCourses = byDay[day]
        if (!dayCourses.length) return null
        return (
          <div key={day} className="border-b border-border">
            <div className="px-4 py-2 bg-muted">
              <body>{day}</body>
            </div>
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
    </div>
  )
}
