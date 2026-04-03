import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { collection, addDoc, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { useProject } from '../hooks/useProject'
import { nextDatesForDay, dayIndexToHe } from '../utils/dates'

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
  const [dueDate, setDueDate] = useState('')
  const [briefFile, setBriefFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (project) {
      setCourseId(project.courseId ?? '')
      setTitle(project.title ?? '')
      setDescription(project.description ?? '')
      if (project.dueDate) {
        setDueDate(project.dueDate.toDate().toISOString().slice(0, 10))
      }
    }
  }, [project])

  const loading = isEdit ? projectLoading || coursesLoading : coursesLoading

  const selectedCourse = courses.find(c => c.id === courseId)
  const quickDates = selectedCourse ? nextDatesForDay(selectedCourse.day) : []

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      onError?.('סוג קובץ לא נתמך. ניתן להעלות PDF, PNG, JPG בלבד.')
      e.target.value = ''
      return
    }
    setBriefFile(file)
  }

  async function uploadBrief(newProjectId, file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const storageRef = ref(storage, `briefs/${newProjectId}/${Date.now()}_${file.name}`)
    await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file)
      task.on('state_changed', null, reject, async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          await addDoc(collection(db, 'projects', newProjectId, 'briefs'), {
            fileName: file.name,
            fileUrl: url,
            fileType: ext,
            uploadedAt: serverTimestamp(),
          })
          resolve()
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!courseId || !title) return

    setSaving(true)
    try {
      const dueDateValue = dueDate ? Timestamp.fromDate(new Date(dueDate + 'T00:00:00')) : null

      if (isEdit) {
        const update = { courseId, title, description }
        if (dueDateValue) update.dueDate = dueDateValue
        await updateDoc(doc(db, 'projects', projectId), update)
        navigate(`/projects/${projectId}`)
      } else {
        const data = { courseId, title, description, createdAt: serverTimestamp() }
        if (dueDateValue) data.dueDate = dueDateValue

        const docRef = await addDoc(collection(db, 'projects'), data)

        if (briefFile) {
          await uploadBrief(docRef.id, briefFile)
        }

        navigate(`/projects/${docRef.id}`)
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
            onChange={e => { setCourseId(e.target.value); setDueDate('') }}
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

        <div className="border border-gray-100 rounded p-3 space-y-2">
          <div className="text-sm text-gray-500 font-medium">תאריך הגשה (אופציונלי)</div>
          {quickDates.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-xs text-gray-400">בחר תאריך ({dayIndexToHe(selectedCourse.day)})</div>
              <div className="flex flex-wrap gap-2">
                {quickDates.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDueDate(dueDate === d ? '' : d)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      dueDate === d
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(new Date(d + 'T00:00:00'))}
                  </button>
                ))}
              </div>
              {dueDate && (
                <div className="text-xs text-gray-400">
                  נבחר: {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dueDate + 'T00:00:00'))}
                </div>
              )}
            </div>
          ) : (
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              dir="ltr"
            />
          )}
        </div>

        {!isEdit && (
          <div className="border border-gray-100 rounded p-3 space-y-2">
            <div className="text-sm text-gray-500 font-medium">בריף (אופציונלי)</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-gray-300 rounded px-3 py-2 text-sm text-gray-500 text-center"
            >
              {briefFile ? briefFile.name : 'בחר קובץ PDF / תמונה'}
            </button>
            {briefFile && (
              <button
                type="button"
                onClick={() => { setBriefFile(null); fileInputRef.current.value = '' }}
                className="text-xs text-red-400"
              >
                הסר קובץ
              </button>
            )}
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
