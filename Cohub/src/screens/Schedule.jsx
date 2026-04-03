import { useCourses } from '../hooks/useCourses'

const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']

export default function Schedule() {
  const { courses, loading } = useCourses()

  if (loading) return <div className="p-4 text-right text-gray-400">טוען...</div>

  const byDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = courses.filter(c => c.day === day)
    return acc
  }, {})

  return (
    <div className="text-right">
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold">מערכת שעות</h1>
      </div>
      {DAY_ORDER.map(day => {
        const dayCourses = byDay[day]
        if (!dayCourses.length) return null
        return (
          <div key={day} className="border-b border-gray-100">
            <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-200">
              {day}
            </div>
            {dayCourses.map(course => (
              <div key={course.id} className="px-4 py-3 flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: course.color }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{course.name}</div>
                  <div className="text-xs text-gray-500">{course.hours} · {course.location}</div>
                  <div className="text-xs text-gray-400">{course.lecturer}</div>
                  {course.notes && (
                    <div className="text-xs text-gray-400 mt-0.5">{course.notes}</div>
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
