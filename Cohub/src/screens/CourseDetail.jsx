import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { useProjects } from '../hooks/useProjects'
import { useMilestones } from '../hooks/useMilestones'
import { Timeline } from '../components/Timeline/Timeline'
import { dayIndexToHe } from '../utils/dates'
import { Pencil, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/PageHeader'

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

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

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (course) {
      setForm({
        name: course.name ?? '',
        day: course.day ?? 0,
        hours: course.hours ?? '',
        lecturer: course.lecturer ?? '',
        location: course.location ?? '',
        courseUrl: course.courseUrl ?? '',
        notes: course.notes ?? '',
      })
    }
  }, [course])

  function handleField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        name: form.name,
        day: Number(form.day),
        hours: form.hours,
        lecturer: form.lecturer,
        location: form.location,
        courseUrl: form.courseUrl,
        notes: form.notes,
      })
      setEditing(false)
    } catch {
      onError?.('שגיאה בשמירת הקורס')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !course) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right">
      <PageHeader
        title={course?.name}
        action={
          <Link to={`/projects/new?courseId=${courseId}`} className="action-link text-sm">
            + פרויקט חדש
          </Link>
        }
      />
      <div className="px-4 pt-3">
        <Link to="/" className="text-muted-foreground flex items-center gap-0.5 text-sm">
          <ChevronRight size={16} />
          חזרה
        </Link>
      </div>

      {form && (
        <div className="page-body border-b border-border pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">פרטי קורס</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-muted-foreground">
                <Pencil size={16} />
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground">ביטול</button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'שומר...' : 'שמור'}
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="field">
                <label className="field-label">שם הקורס</label>
                <Input value={form.name} onChange={e => handleField('name', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">יום</label>
                <select
                  value={form.day}
                  onChange={e => handleField('day', Number(e.target.value))}
                  className="field-input"
                >
                  {DAY_OPTIONS.map(d => (
                    <option key={d} value={d}>{dayIndexToHe(d)}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">שעות</label>
                <Input value={form.hours} onChange={e => handleField('hours', e.target.value)} placeholder="10:00-13:00" />
              </div>
              <div className="field">
                <label className="field-label">מרצה</label>
                <Input value={form.lecturer} onChange={e => handleField('lecturer', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">מיקום</label>
                <Input value={form.location} onChange={e => handleField('location', e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">קישור</label>
                <Input value={form.courseUrl} onChange={e => handleField('courseUrl', e.target.value)} dir="ltr" placeholder="https://moodle..." />
              </div>
              <div className="field">
                <label className="field-label">הערות</label>
                <Input value={form.notes} onChange={e => handleField('notes', e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              <InfoRow label="יום" value={typeof course.day === 'number' ? dayIndexToHe(course.day) : course.day} />
              <InfoRow label="שעות" value={course.hours} />
              <InfoRow label="מרצה" value={course.lecturer} />
              <InfoRow label="מיקום" value={course.location} />
              {course.courseUrl && (
                <InfoRow label="לינק" value={
                  <a href={course.courseUrl} target="_blank" rel="noreferrer" className="action-link" dir="ltr">
                    {course.courseUrl}
                  </a>
                } />
              )}
              {course.notes && <InfoRow label="הערות" value={course.notes} />}
            </div>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="state-empty">אין פרויקטים עדיין</div>
      ) : (
        <Timeline projects={projects} milestones={courseMilestones} />
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-16">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
