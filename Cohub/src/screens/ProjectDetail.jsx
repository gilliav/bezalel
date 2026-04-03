import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useProject } from '../hooks/useProject'
import { useCourses } from '../hooks/useCourses'
import { FileUpload } from '../components/FileUpload'
import { formatDateHe, isOverdue, nextDatesForDay, dayIndexToHe } from '../utils/dates'

export default function ProjectDetail({ onError }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, milestones, briefs, loading, error } = useProject(projectId)
  const { courses } = useCourses()
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')

  useEffect(() => {
    if (error) onError?.('שגיאה בטעינת הפרויקט')
  }, [error, onError])

  const course = courses.find(c => c.id === project?.courseId)
  const quickDates = course ? nextDatesForDay(course.day) : []

  async function handleDelete() {
    if (!confirm('למחוק את הפרויקט?')) return
    try {
      await deleteDoc(doc(db, 'projects', projectId))
      navigate(-1)
    } catch {
      onError?.('שגיאה במחיקת הפרויקט')
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault()
    if (!milestoneTitle || !milestoneDue) return
    try {
      await addDoc(collection(db, 'projects', projectId, 'milestones'), {
        title: milestoneTitle,
        dueDate: Timestamp.fromDate(new Date(milestoneDue)),
        projectId,
        courseId: project.courseId,
        projectTitle: project.title,
      })
      setMilestoneTitle('')
      setMilestoneDue('')
      setAddingMilestone(false)
    } catch {
      onError?.('שגיאה בהוספת הגשה')
    }
  }

  if (loading) return <div className="p-4 text-right text-gray-400">טוען...</div>
  if (!project) return <div className="p-4 text-right text-gray-400">פרויקט לא נמצא</div>

  return (
    <div className="text-right">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex gap-3">
          <Link to={`/projects/${projectId}/edit`} className="text-sm text-blue-600">ערוך</Link>
          <button onClick={handleDelete} className="text-sm text-red-500">מחק</button>
        </div>
        <div>
          <h1 className="text-lg font-bold">{project.title}</h1>
          {course && (
            <div
              className="text-xs text-white px-2 py-0.5 rounded-full inline-block mt-0.5"
              style={{ backgroundColor: course.color }}
            >
              {course.name}
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
          {project.description}
        </div>
      )}

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setAddingMilestone(a => !a)}
            className="text-xs text-blue-600"
          >
            + הגשה
          </button>
          <h2 className="text-sm font-semibold text-gray-700">הגשות</h2>
        </div>

        {addingMilestone && (
          <form onSubmit={handleAddMilestone} className="mb-3 space-y-2">
            <input
              type="text"
              value={milestoneTitle}
              onChange={e => setMilestoneTitle(e.target.value)}
              placeholder="שם ההגשה"
              required
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right"
            />
            {quickDates.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-xs text-gray-400">בחר תאריך ({dayIndexToHe(course.day)})</div>
                <div className="flex flex-wrap gap-2">
                  {quickDates.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setMilestoneDue(d)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        milestoneDue === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-600'
                      }`}
                    >
                      {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(new Date(d + 'T00:00:00'))}
                    </button>
                  ))}
                </div>
                {milestoneDue && (
                  <div className="text-xs text-gray-400">
                    נבחר: {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(milestoneDue + 'T00:00:00'))}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="date"
                value={milestoneDue}
                onChange={e => setMilestoneDue(e.target.value)}
                required
                className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                dir="ltr"
              />
            )}
            <button
              type="submit"
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
            >
              הוסף
            </button>
          </form>
        )}

        {milestones.length === 0 && !addingMilestone && (
          <div className="text-sm text-gray-400">אין הגשות</div>
        )}
        {milestones.map(m => (
          <div key={m.id} className={`py-2 border-b border-gray-50 ${isOverdue(m.dueDate) ? 'text-red-500' : 'text-gray-700'}`}>
            <div className="text-sm font-medium">{m.title}</div>
            <div className="text-xs text-gray-400">{formatDateHe(m.dueDate)}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">בריפים וקבצים</h2>
        <FileUpload projectId={projectId} onError={onError} />
        {briefs.map(b => (
          <a
            key={b.id}
            href={b.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-sm text-blue-600 py-1"
          >
            {b.fileName}
          </a>
        ))}
      </div>
    </div>
  )
}
