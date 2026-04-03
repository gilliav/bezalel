import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCourses } from '../hooks/useCourses'
import { useProjects } from '../hooks/useProjects'
import { useMilestones } from '../hooks/useMilestones'
import { Timeline } from '../components/Timeline/Timeline'

export default function CourseDetail({ onError }) {
  const { courseId } = useParams()
  const { courses, error: cError } = useCourses()
  const { projects, loading, error: pError } = useProjects(courseId)
  const { milestones, error: mError } = useMilestones()

  const error = cError || pError || mError
  useEffect(() => {
    if (error) onError?.('שגיאה בטעינת הקורס')
      console.error(error)
  }, [error, onError])

  const course = courses.find(c => c.id === courseId)
  const courseMilestones = milestones.filter(m => m.courseId === courseId)

  if (loading) return <div className="p-4 text-right text-gray-400">טוען...</div>

  return (
    <div className="text-right">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <Link to={`/projects/new?courseId=${courseId}`} className="text-sm text-blue-600">
          + פרויקט
        </Link>
        <div>
          <h1 className="text-lg font-bold">{course?.name}</h1>
          <div className="text-xs text-gray-400">{course?.day} · {course?.hours}</div>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">אין פרויקטים עדיין</div>
      ) : (
        <Timeline projects={projects} milestones={courseMilestones} />
      )}
    </div>
  )
}
