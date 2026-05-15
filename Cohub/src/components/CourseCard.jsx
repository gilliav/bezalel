import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dayIndexToHe } from '../utils/dates'
import { Input } from './ui/input'
import { Button } from './ui/button'

export function CourseCard({ course, onSave }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(course.courseUrl ?? '')
  const [notes, setNotes] = useState(course.notes ?? '')

  function handleSave() {
    onSave({ ...course, courseUrl: url, notes })
    setEditing(false)
  }

  return (
    <div className="list-row-stacked">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="color-dot" style={{ backgroundColor: course.color }} />
          <Link to={`/courses/${course.id}`} className="font-semibold text-foreground">
            {course.name}
          </Link>
        </div>
        <button
          aria-label="עריכה"
          onClick={() => setEditing(e => !e)}
          className="text-sm text-muted-foreground"
        >
          עריכה
        </button>
      </div>

      {course.isOnline ? (
        <div className="text-base text-muted-foreground">
          קורס מקוון · {course.lecturer}
        </div>
      ) : (
        <div className="text-base text-muted-foreground">
          {dayIndexToHe(course.day)} · {course.hours} · {course.lecturer} · {course.location}
        </div>
      )}

      {course.courseUrl && !editing && (
        <a
          href={course.courseUrl}
          target="_blank"
          rel="noreferrer"
          className="action-link text-sm"
          aria-label="קישור לקורס"
        >
          קישור
        </a>
      )}

      {notes && !editing && (
        <div className="text-sm text-muted-foreground">{notes}</div>
      )}

      {editing && (
        <div className="flex flex-col gap-2 mt-1">
          <Input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="קישור לדרייב / מירו"
            dir="ltr"
          />
          <Input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="הערות (אופציונלי)"
          />
          <Button size="sm" onClick={handleSave} aria-label="שמור">
            שמור
          </Button>
        </div>
      )}
    </div>
  )
}
