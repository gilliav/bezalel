import { useState } from 'react'
import { Link } from 'react-router-dom'

export function CourseCard({ course, onSave }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(course.courseUrl ?? '')
  const [notes, setNotes] = useState(course.notes ?? '')

  function handleSave() {
    onSave({ ...course, courseUrl: url, notes })
    setEditing(false)
  }

  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: course.color }}
          />
          <Link to={`/courses/${course.id}`} className="font-semibold text-gray-900">
            {course.name}
          </Link>
        </div>
        <button
          aria-label="עריכה"
          onClick={() => setEditing(e => !e)}
          className="text-xs text-gray-400"
        >
          עריכה
        </button>
      </div>

      <div className="text-sm text-gray-500 mt-1">
        {course.day} · {course.hours} · {course.lecturer} · {course.location}
      </div>

      {course.courseUrl && !editing && (
        <a
          href={course.courseUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-500 mt-1 inline-block"
          aria-label="קישור לקורס"
        >
          קישור
        </a>
      )}

      {notes && !editing && (
        <div className="text-xs text-gray-400 mt-1">{notes}</div>
      )}

      {editing && (
        <div className="mt-2 space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="קישור לדרייב / מירו"
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right"
            dir="ltr"
          />
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="הערות (אופציונלי)"
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right"
          />
          <button
            aria-label="שמור"
            onClick={handleSave}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
          >
            שמור
          </button>
        </div>
      )}
    </div>
  )
}
