import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { collection, addDoc, doc, updateDoc, Timestamp, serverTimestamp, getDocs, deleteDoc, query } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { Trash2 } from 'lucide-react'
import { db, storage } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { useProject } from '../hooks/useProject'
import { nextDatesForDay, dayIndexToHe } from '../utils/dates'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

const HE_WEEK_NUMS = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']

function WeekPicker({ dates, value, onChange, dayName }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">יום {dayName}</span>
      <div className="grid grid-cols-6 gap-1">
        {dates.map((d, i) => {
          const isSelected = value === d
          const dateObj = new Date(d + 'T00:00:00')
          const dateLabel = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(dateObj)
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(isSelected ? '' : d)}
              className={`
                flex flex-col items-center gap-0.5 py-2 rounded-md border text-center transition-all
                ${isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-card'
                }
              `}
            >
              <span className={`text-xs font-bold leading-none ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                שב׳ {HE_WEEK_NUMS[i + 1]}
              </span>
              <span className="text-sm font-medium leading-none mt-0.5">{dateLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ProjectForm({ onError }) {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(projectId)

  const { courses, loading: coursesLoading } = useCourses()
  const { project, milestones, loading: projectLoading } = useProject(projectId)

  const [courseId, setCourseId] = useState(searchParams.get('courseId') ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isMultiDeadline, setIsMultiDeadline] = useState(false)
  const [localMilestones, setLocalMilestones] = useState([]) // { localId, title, dueDate }
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!project) return
    setCourseId(project.courseId ?? '')
    setTitle(project.title ?? '')
    setDescription(project.description ?? '')
    if (project.dueDate) {
      setDueDate(project.dueDate.toDate().toISOString().slice(0, 10))
    }
  }, [project])

  useEffect(() => {
    if (!project || !isEdit) return
    if (!project.dueDate && milestones.length > 0) {
      setIsMultiDeadline(true)
      setLocalMilestones(
        milestones.map(m => ({
          localId: m.id,
          title: m.title,
          dueDate: m.dueDate.toDate().toISOString().slice(0, 10),
        }))
      )
    }
  }, [project, milestones, isEdit])

  function addMilestone() {
    setLocalMilestones(prev => [
      ...prev,
      { localId: Date.now().toString(), title: '', dueDate: '' },
    ])
  }

  function updateMilestone(localId, field, value) {
    setLocalMilestones(prev =>
      prev.map(m => (m.localId === localId ? { ...m, [field]: value } : m))
    )
  }

  function removeMilestone(localId) {
    setLocalMilestones(prev => prev.filter(m => m.localId !== localId))
  }

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
    setAttachmentFile(file)
  }

  async function writeMilestones(projectDocId, projectTitle, courseId) {
    const snap = await getDocs(query(collection(db, 'projects', projectDocId, 'milestones')))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
    await Promise.all(
      localMilestones.map(m =>
        addDoc(collection(db, 'projects', projectDocId, 'milestones'), {
          title: m.title,
          dueDate: Timestamp.fromDate(new Date(m.dueDate + 'T00:00:00')),
          projectId: projectDocId,
          courseId,
          projectTitle,
        })
      )
    )
  }

  async function uploadAttachment(newProjectId, file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const storageRef = ref(storage, `attachments/${newProjectId}/${Date.now()}_${file.name}`)
    await new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file)
      task.on('state_changed', null, reject, async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          await addDoc(collection(db, 'projects', newProjectId, 'attachments'), {
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
    if (isMultiDeadline && localMilestones.length === 0) return
    if (isMultiDeadline && localMilestones.some(m => !m.title || !m.dueDate)) return

    setSaving(true)
    try {
      const dueDateValue = dueDate ? Timestamp.fromDate(new Date(dueDate + 'T00:00:00')) : null

      if (isEdit) {
        const update = { courseId, title, description }
        if (isMultiDeadline) {
          update.dueDate = null
          await writeMilestones(projectId, title, courseId)
        } else {
          if (dueDateValue) update.dueDate = dueDateValue
          if (!dueDateValue) {
            const snap = await getDocs(query(collection(db, 'projects', projectId, 'milestones')))
            await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
          }
        }
        await updateDoc(doc(db, 'projects', projectId), update)
        navigate(`/projects/${projectId}`)
      } else {
        const data = { courseId, title, description, createdAt: serverTimestamp() }
        if (!isMultiDeadline && dueDateValue) data.dueDate = dueDateValue

        const docRef = await addDoc(collection(db, 'projects'), data)

        if (isMultiDeadline) {
          await writeMilestones(docRef.id, title, courseId)
        }

        if (attachmentFile) {
          await uploadAttachment(docRef.id, attachmentFile)
        }

        navigate(`/projects/${docRef.id}`)
      }
    } catch {
      onError?.('שגיאה בשמירת הפרויקט')
      setSaving(false)
    }
  }

  if (loading) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right">
      <header className="page-header">
        <h1>{isEdit ? 'עריכת פרויקט' : 'פרויקט חדש'}</h1>
        <Link to={isEdit ? `/projects/${projectId}` : '/'} className="text-base text-muted-foreground">
          ביטול
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="page-body">
        <div className="field">
          <label className="field-label">קורס *</label>
          <select
            value={courseId}
            onChange={e => { setCourseId(e.target.value); setDueDate('') }}
            required
            className="field-input"
          >
            <option value="">בחר קורס</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label">שם הפרויקט *</label>
          <Input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="למשל: פוסטר טיפוגרפי"
          />
        </div>

        <div className="field">
          <label className="field-label">תיאור (אופציונלי)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="בריף, הנחיות, קישורים..."
            className="field-input resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isMultiDeadline}
            onChange={e => {
              setIsMultiDeadline(e.target.checked)
              if (e.target.checked) {
                setDueDate('')
              } else {
                setLocalMilestones([])
              }
            }}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-base text-foreground font-medium">פרויקט עם כמה שלבים</span>
        </label>

        {!isMultiDeadline && (
          <div className="flex flex-col gap-2 border border-border rounded-md p-3">
            <span className="text-base text-muted-foreground font-medium">תאריך הגשה (אופציונלי)</span>
            {quickDates.length > 0 ? (
              <WeekPicker
                dates={quickDates}
                value={dueDate}
                onChange={setDueDate}
                dayName={dayIndexToHe(selectedCourse.day)}
              />
            ) : (
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="field-input"
                dir="ltr"
              />
            )}
          </div>
        )}

        {isMultiDeadline && (
          <div className="flex flex-col gap-3 border border-border rounded-md p-3">
            <span className="text-base text-muted-foreground font-medium">שלבים</span>

            {localMilestones.map(m => (
              <div key={m.localId} className="flex flex-col gap-2 pb-3 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex flex-row gap-2">
                  <Input
                    type="text"
                    value={m.title}
                    onChange={e => updateMilestone(m.localId, 'title', e.target.value)}
                    placeholder="שם השלב"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.localId)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {quickDates.length > 0 ? (
                  <WeekPicker
                    dates={quickDates}
                    value={m.dueDate}
                    onChange={val => updateMilestone(m.localId, 'dueDate', val)}
                    dayName={dayIndexToHe(selectedCourse.day)}
                  />
                ) : (
                  <input
                    type="date"
                    value={m.dueDate}
                    onChange={e => updateMilestone(m.localId, 'dueDate', e.target.value)}
                    className="field-input"
                    dir="ltr"
                  />
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addMilestone}
              className="action-link text-sm self-start"
            >
              + הוסף שלב
            </button>
          </div>
        )}

        {!isEdit && (
          <div className="flex flex-col gap-2 border border-border rounded-md p-3">
            <span className="text-base text-muted-foreground font-medium">בריף (אופציונלי)</span>
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
              className="border border-dashed border-border rounded-md px-3 py-2 text-base text-muted-foreground text-center"
            >
              {attachmentFile ? attachmentFile.name : 'בחר קובץ PDF / תמונה'}
            </button>
            {attachmentFile && (
              <button
                type="button"
                onClick={() => { setAttachmentFile(null); fileInputRef.current.value = '' }}
                className="text-sm text-destructive self-start"
              >
                הסר קובץ
              </button>
            )}
          </div>
        )}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'צור פרויקט'}
        </Button>
      </form>
    </div>
  )
}
