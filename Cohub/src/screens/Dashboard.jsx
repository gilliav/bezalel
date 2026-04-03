import { useEffect } from 'react'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { useAllProjects } from '../hooks/useProjects'
import { MilestoneItem } from '../components/MilestoneItem'
import { isOverdue } from '../utils/dates'
import { Link } from 'react-router-dom'

export default function Dashboard({ onError }) {
  const { milestones, loading: mlLoading, error: mlError } = useMilestones()
  const { courses, loading: cLoading, error: cError } = useCourses()
  const { projects, loading: pLoading, error: pError } = useAllProjects()

  useEffect(() => {
    if (mlError || cError || pError) onError?.('שגיאה בטעינת הנתונים')
  }, [mlError, cError, pError, onError])

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))

  // Normalize projects-with-dueDate into milestone-shaped items
  const projectItems = projects
    .filter(p => p.dueDate)
    .map(p => ({
      id: `project-${p.id}`,
      projectId: p.id,
      title: p.title,
      projectTitle: '',
      dueDate: p.dueDate,
      courseId: p.courseId,
      isProjectItem: true,
    }))

  const allItems = [...milestones, ...projectItems].sort(
    (a, b) => a.dueDate.toDate() - b.dueDate.toDate()
  )

  const overdue = allItems.filter(m => isOverdue(m.dueDate))
  const upcoming = allItems.filter(m => !isOverdue(m.dueDate))

  if (mlLoading || cLoading || pLoading) {
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

      {allItems.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">
          אין פרויקטים פעילים
        </div>
      )}
    </div>
  )
}
