import { useEffect } from 'react'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { MilestoneItem } from '../components/MilestoneItem'
import { isOverdue } from '../utils/dates'
import { Link } from 'react-router-dom'

export default function Dashboard({ onError }) {
  const { milestones, loading: mlLoading, error: mlError } = useMilestones()
  const { courses, loading: cLoading, error: cError } = useCourses()

  useEffect(() => {
    if (mlError || cError) onError?.('שגיאה בטעינת הנתונים')
  }, [mlError, cError, onError])

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
  const overdue = milestones.filter(m => isOverdue(m.dueDate))
  const upcoming = milestones.filter(m => !isOverdue(m.dueDate))

  if (mlLoading || cLoading) {
    return <div className="p-4 text-right text-gray-400">טוען...</div>
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <Link to="/projects/new" className="text-sm text-blue-600 font-medium">
          + פרויקט חדש
        </Link>
        <h1 className="text-lg font-bold">פרויקטים</h1>
      </div>

      {overdue.length > 0 && (
        <section>
          <h2 className="px-4 py-2 text-xs font-semibold text-red-500 uppercase tracking-wide">
            עבר הזמן
          </h2>
          {overdue.map(m => (
            <MilestoneItem key={m.id} milestone={m} course={courseMap[m.courseId]} />
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          {overdue.length > 0 && (
            <h2 className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              קרוב
            </h2>
          )}
          {upcoming.map(m => (
            <MilestoneItem key={m.id} milestone={m} course={courseMap[m.courseId]} />
          ))}
        </section>
      )}

      {milestones.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">
          אין פרויקטים פעילים
        </div>
      )}
    </div>
  )
}
