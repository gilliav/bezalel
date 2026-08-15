import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

// Skipping a single course or marking one "not taken" mid-deck isn't wired
// to a button here for now — no login means no reliable way to let a
// student revisit a checklist mistake later anyway, so the flow is just
// rate-and-continue (אישור) or cancel-the-whole-thing (ביטול). The handlers
// for both still exist in CatalogRate.jsx, commented out, ready to bring
// back if that changes.
export function SwipeCard({ course, onSubmit, onCancel, showCourseInfo = true }) {
  const [recommend, setRecommend] = useState(null)
  const [profGood, setProfGood] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [interesting, setInteresting] = useState(null)
  const [workload, setWorkload] = useState(null)
  const [attendanceTaken, setAttendanceTaken] = useState(null)
  const [comment, setComment] = useState('')

  function handleSubmit() {
    onSubmit({ recommend, profGood, difficulty, interesting, workload, attendanceTaken, comment })
  }

  return (
    <div className="flex flex-col border border-border rounded-[8px] p-[16px] gap-[12px]">
      {showCourseInfo && (
        <>
          <h2>{course.name}</h2>
          <div className="text-sm text-muted-foreground">{course.lecturer} · {course.category}</div>
          <p className="text-sm text-foreground">{course.description}</p>
        </>
      )}

      <div className="field">
        <label className="field-label">האם תמליץ/י על הקורס?</label>
        <ThumbsField value={recommend} onChange={setRecommend} />
      </div>

      <div className="grid grid-cols-2 gap-2">
      <StarField label="איכות ההוראה" value={profGood} onChange={setProfGood} />
      <StarField label="רמת הקושי" value={difficulty} onChange={setDifficulty} />
      <StarField label="עניין" value={interesting} onChange={setInteresting} />
      <StarField label="עומס העבודה" value={workload} onChange={setWorkload} />
      </div>

      <div className="field">
        <label className="field-label">האם נבדקת נוכחות?</label>
        <ThumbsField value={attendanceTaken} onChange={setAttendanceTaken} />
      </div>

      <div className="field">
        <label className="field-label">תגובה (אופציונלי)</label>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} />
      </div>

      <div className="flex flex-row gap-2 mt-2">
        <Button className="w-full rounded-[0px]" onClick={handleSubmit} disabled={recommend === null}>
          אישור
        </Button>
        <Button type="button" variant="outline" className="w-full rounded-[0px]" onClick={onCancel}>
          ביטול
        </Button>
      </div>
    </div>
  )
}

function ToggleButton({ onClick, children, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center p-1 hover:bg-transparent focus:outline-none"
      {...props}
    >
      {children}
    </button>
  )
}

function ThumbsField({ value, onChange }) {
  return (
    <div className="flex gap-1">
      <ToggleButton onClick={() => onChange(value === true ? null : true)} aria-label="חיובי">
        <ThumbsUp
          size={24}
          strokeWidth={1.5}
          fill={value === true ? 'currentColor' : 'none'}
          stroke="#000000"
          style={{ color: value === true ? 'var(--rating-positive)' : 'currentColor' }}
        />
      </ToggleButton>
      <ToggleButton onClick={() => onChange(value === false ? null : false)} aria-label="שלילי">
        <ThumbsDown
          size={24}
          strokeWidth={1.5}
          fill={value === false ? 'currentColor' : 'none'}
          stroke="#000000"
          style={{ color: value === false ? 'var(--rating-negative)' : 'currentColor' }}
        />
      </ToggleButton>
    </div>
  )
}

function StarField({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            aria-label={`${label}: ${n}`}
            className="focus:outline-none"
          >
            <Star
              size={24}
              strokeWidth={1.5}
              fill={value >= n ? 'var(--rating-star)' : 'none'}
              stroke="currentColor"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
