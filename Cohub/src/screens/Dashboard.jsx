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
    return <div className="state-loading">טוען...</div>
  }

  return (
    <div className="text-right">
      <header className="page-header bg-muted">
        <h1>הגשות</h1>
        <Link to="/projects/new" className="action-link">+ פרויקט חדש</Link>
      </header>

      {overdue.length > 0 && (
        <section>
          <body className="section-label text-destructive">דדליין עבר</body>
          {overdue.map(m => (
            <MilestoneItem key={m.id} milestone={m} course={courseMap[m.courseId]} />
          ))}
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          {upcoming.map(m => (
            <MilestoneItem key={m.id} milestone={m} course={courseMap[m.courseId]} />
          ))}
        </section>
      )}

      {allItems.length === 0 && (
        <div className="state-empty">אין פרויקטים פעילים</div>
      )}
    </div>
  )
}
