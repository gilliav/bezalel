import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useProject } from '../hooks/useProject'
import { useCourses } from '../hooks/useCourses'
import {formatDateHe, formatRelativeDateHe, isOverdue, nextDatesForDay, dayIndexToHe, formatDateShort} from '../utils/dates';
import { Pencil, Trash2, ChevronRight, Maximize2, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/PageHeader'
import { Tag } from '../components/ui/tag'
import { DateTag } from '../components/DateTag'

export default function ProjectDetail({ onError }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, milestones, attachments, loading, error } = useProject(projectId)
  const { courses } = useCourses()
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (error) onError?.('שגיאה בטעינת הפרויקט')
  }, [error, onError])

  const course = courses.find(c => c.id === project?.courseId)
  const quickDates = course ? nextDatesForDay(course.day) : []

  const sortedMilestones = [...milestones].sort(
    (a, b) => a.dueDate.toDate() - b.dueDate.toDate()
  )

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

  if (loading) return <div className="state-loading">טוען...</div>
  if (!project) return <div className="state-loading">פרויקט לא נמצא</div>

  return (
    <div className="text-right">
      <PageHeader
        hasBackButton
        title={project.title}
        action={
          <div className="flex gap-3 items-center">
            <Link to={`/projects/${projectId}/edit`} className="text-muted-foreground">
              <Pencil size={18} />
            </Link>
            <button onClick={handleDelete} className="text-destructive">
              <Trash2 size={18} />
            </button>
          </div>
        }
      />

      <div className="page-body">

       

        <div className="flex flex-wrap gap-2">
          {course && (
            <Link to={`/courses/${course.id}`}>
            <Tag value={course.name} color={course.color} />
            </Link>
          )}
          {project.dueDate && <DateTag dueDate={project.dueDate} includeRelative />}
        </div>
         {project.description && (
          <p className="text-base text-foreground">{project.description}</p>
        )}

        {/* Attachments */}
        {attachments?.map(b => (
          <div key={b.id}>
            {['png', 'jpg', 'jpeg'].includes(b.fileType) ? (
              <img
                src={b.fileUrl}
                alt={b.fileName}
                className="max-w-full border border-border cursor-zoom-in"
                onClick={() => setLightbox({ url: b.fileUrl, type: 'image' })}
              />
            ) : b.fileType === 'pdf' ? (
              <div className="relative">
                <iframe
                  src={b.fileUrl}
                  title={b.fileName}
                  className="w-full border border-border"
                  style={{ height: '500px' }}
                />
                <button
                  onClick={() => setLightbox({ url: b.fileUrl, type: 'pdf' })}
                  className="absolute top-2 left-2 bg-background/80 p-1 text-muted-foreground"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            ) : (
              <a href={b.fileUrl} target="_blank" rel="noreferrer" className="action-link block py-1">
                {b.fileName}
              </a>
            )}
          </div>
        ))}

        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 left-4 text-white bg-black/40 p-1.5 z-10"
            >
              <X size={20} />
            </button>
            {lightbox.type === 'image' ? (
              <img
                src={lightbox.url}
                alt=""
                className="max-w-full max-h-full object-contain"
                style={{ touchAction: 'pinch-zoom' }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <iframe
                src={lightbox.url}
                className="w-full h-full"
                onClick={e => e.stopPropagation()}
              />
            )}
          </div>
        )}

        {/* Milestones */}
        <section className="flex flex-col">
          {sortedMilestones.map((m) => {
            const overdue = isOverdue(m.dueDate)
            return (
              <div
                key={m.id}
                className={`list-row-stacked ${overdue ? 'opacity-60' : ''}`}
              >
                <span className="text-base font-medium text-foreground">{m.title}</span>
                <Tag
                  value={`${formatRelativeDateHe(m.dueDate)} · ${formatDateHe(m.dueDate)}`}
                  className={overdue ? 'text-destructive bg-destructive/10' : ''}
                />
              </div>
            )
          })}

{/* TODO: consider adding milestones in edit mode only */}
          {!addingMilestone && (
            <div className="text-base text-muted-foreground mt-3">
             פרויקט מתגלגל? <button onClick={() => setAddingMilestone(true)} className="action-link">לחצו להוספת דדליין</button>
            </div>
          
          )}

          {addingMilestone && (
            <form onSubmit={handleAddMilestone} className="flex flex-col gap-2 mt-3">
              <Input
                type="text"
                value={milestoneTitle}
                onChange={e => setMilestoneTitle(e.target.value)}
                placeholder="שם השלב"
                required
              />
              {quickDates.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-muted-foreground">
                    בחר תאריך ({dayIndexToHe(course.day)})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickDates.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setMilestoneDue(d)}
                        className={`text-sm px-2.5 py-1 border transition-colors ${
                          milestoneDue === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(new Date(d + 'T00:00:00'))}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  type="date"
                  value={milestoneDue}
                  onChange={e => setMilestoneDue(e.target.value)}
                  required
                  className="field-input"
                  dir="ltr"
                />
              )}
              <Button type="submit" size="sm">הוסף</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setAddingMilestone(false)}>ביטול</Button>
            </form>
          )}
        </section>

      </div>
    </div>
  )
}
