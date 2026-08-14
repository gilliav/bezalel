import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

export function SwipeCard({ course, onSubmit, onSkip, onNotTaken }) {
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
    <div className="page-body border border-border rounded-lg">
      <h2>{course.name}</h2>
      <div className="text-sm text-muted-foreground">{course.lecturer} · {course.category}</div>
      <p className="text-sm text-foreground">{course.description}</p>

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

      <div className="flex flex-col gap-2 mt-2">
        <Button onClick={handleSubmit} disabled={recommend === null}>
          שליחה והמשך
        </Button>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={onSkip} className="flex-1">
            דלג/י
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onNotTaken} className="flex-1">
            לא למדתי את הקורס
          </Button>
        </div>
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
          className="w-6 h-6"
          fill={value === true ? 'currentColor' : 'none'}
          stroke="black"
          style={{ color: value === true ? '#56a77f' : 'currentColor' }}
        />
      </ToggleButton>
      <ToggleButton onClick={() => onChange(value === false ? null : false)} aria-label="שלילי">
        <ThumbsDown
          className="w-6 h-6"
          fill={value === false ? 'currentColor' : 'none'}
          stroke="black"
          style={{ color: value === false ? '#c86565' : 'currentColor' }}
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
              className="w-6 h-6"
              fill={value >= n ? '#8a85dd' : 'none'}
              stroke="currentColor"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
