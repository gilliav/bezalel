import { useState } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

const SCALE = [1, 2, 3, 4, 5]

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
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={recommend === true ? 'default' : 'outline'}
            onClick={() => setRecommend(true)}
          >
            כן, ממליץ/ה
          </Button>
          <Button
            type="button"
            size="sm"
            variant={recommend === false ? 'default' : 'outline'}
            onClick={() => setRecommend(false)}
          >
            לא ממליץ/ה
          </Button>
        </div>
      </div>

      <ScaleField label="איכות ההוראה" value={profGood} onChange={setProfGood} />
      <ScaleField label="רמת הקושי" value={difficulty} onChange={setDifficulty} />
      <ScaleField label="עד כמה מעניין" value={interesting} onChange={setInteresting} />
      <ScaleField label="עומס העבודה" value={workload} onChange={setWorkload} />

      <div className="field">
        <label className="field-label">האם נבדקת נוכחות?</label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={attendanceTaken === true ? 'default' : 'outline'}
            onClick={() => setAttendanceTaken(true)}
          >
            כן
          </Button>
          <Button
            type="button"
            size="sm"
            variant={attendanceTaken === false ? 'default' : 'outline'}
            onClick={() => setAttendanceTaken(false)}
          >
            לא
          </Button>
        </div>
      </div>

      <div className="field">
        <label className="field-label">תגובה (אופציונלי)</label>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <Button onClick={handleSubmit} disabled={recommend === null}>
          שליחה והמשך
        </Button>
        <div className="flex gap-2">
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

function ScaleField({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="flex gap-1">
        {SCALE.map(n => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={value === n ? 'default' : 'outline'}
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n}`}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  )
}
