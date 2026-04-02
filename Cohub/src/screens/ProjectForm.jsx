import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { collection, addDoc, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { useProject } from '../hooks/useProject'

export default function ProjectForm({ onError }) {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(projectId)

  const { courses, loading: coursesLoading } = useCourses()
  const { project, loading: projectLoading } = useProject(projectId)

  const [courseId, setCourseId] = useState(searchParams.get('courseId') ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setCourseId(project.courseId ?? '')
      setTitle(project.title ?? '')
      setDescription(project.description ?? '')
    }
  }, [project])

  const loading = isEdit ? projectLoading || coursesLoading : coursesLoading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!courseId || !title) return

    setSaving(true)
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'projects', projectId), { courseId, title, description })
        navigate(`/projects/${projectId}`)
      } else {
        const ref = await addDoc(collection(db, 'projects'), {
          courseId,
          title,
          description,
          createdAt: serverTimestamp(),
        })

        if (milestoneTitle && milestoneDue) {
          await addDoc(collection(db, 'projects', ref.id, 'milestones'), {
            title: milestoneTitle,
            dueDate: Timestamp.fromDate(new Date(milestoneDue)),
            projectId: ref.id,
            courseId,
            projectTitle: title,
          })
        }

        navigate(`/projects/${ref.id}`)
      }
    } catch {
      onError?.('שגיאה בשמירת הפרויקט')
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-right text-gray-400">טוען...</div>

  return (
    <div className="text-right">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <Link to={isEdit ? `/projects/${projectId}` : '/'} className="text-sm text-gray-500">
          ביטול
        </Link>
        <h1 className="text-lg font-bold">{isEdit ? 'עריכת פרויקט' : 'פרויקט חדש'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">קורס *</label>
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            required
            className="w-full border border-gray-200 rounded px-2 py-2 text-sm text-right bg-white"
          >
            <option value="">בחר קורס</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">שם הפרויקט *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="למשל: פוסטר טיפוגרפי"
            className="w-full border border-gray-200 rounded px-2 py-2 text-sm text-right"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">תיאור (אופציונלי)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="בריף, הנחיות, קישורים..."
            className="w-full border border-gray-200 rounded px-2 py-2 text-sm text-right resize-none"
          />
        </div>

        {!isEdit && (
          <div className="border border-gray-100 rounded p-3 space-y-3">
            <div className="text-sm text-gray-500 font-medium">אבן דרך ראשונה (אופציונלי)</div>
            <input
              type="text"
              value={milestoneTitle}
              onChange={e => setMilestoneTitle(e.target.value)}
              placeholder="למשל: הגשה סופית"
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-right"
            />
            <input
              type="date"
              value={milestoneDue}
              onChange={e => setMilestoneDue(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              dir="ltr"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'צור פרויקט'}
        </button>
      </form>
    </div>
  )
}
