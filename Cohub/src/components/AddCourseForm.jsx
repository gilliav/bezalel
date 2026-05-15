import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { COURSE_COLORS } from '../utils/colors'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { dayIndexToHe } from '../utils/dates'

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

export function AddCourseForm({ courses, onClose, onError }) {
  const [colorIdx, setColorIdx] = useState(() => courses.length % COURSE_COLORS.length)
  const [form, setForm] = useState({
    name: '',
    day: 0,
    hours: '',
    lecturer: '',
    location: '',
    courseUrl: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  function handleField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function cycleColor() {
    setColorIdx(i => (i + 1) % COURSE_COLORS.length)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await addDoc(collection(db, 'courses'), {
        name: form.name,
        day: Number(form.day),
        hours: form.hours,
        lecturer: form.lecturer,
        location: form.location,
        courseUrl: form.courseUrl,
        notes: form.notes,
        color: COURSE_COLORS[colorIdx],
      })
      onClose()
    } catch {
      onError('שגיאה בהוספת הקורס')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-body border-b border-border pb-4 flex flex-col gap-3">
      <h2 className="text-base font-semibold">קורס חדש</h2>

      <div className="field">
        <label className="field-label" htmlFor="course-name">שם הקורס</label>
        <Input
          id="course-name"
          aria-label="שם הקורס"
          value={form.name}
          onChange={e => handleField('name', e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course-day">יום</label>
        <select
          id="course-day"
          aria-label="יום"
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
        <label className="field-label" htmlFor="course-hours">שעות</label>
        <Input
          id="course-hours"
          aria-label="שעות"
          value={form.hours}
          onChange={e => handleField('hours', e.target.value)}
          placeholder="10:00-13:00"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course-lecturer">מרצה</label>
        <Input
          id="course-lecturer"
          aria-label="מרצה"
          value={form.lecturer}
          onChange={e => handleField('lecturer', e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course-location">מיקום</label>
        <Input
          id="course-location"
          aria-label="מיקום"
          value={form.location}
          onChange={e => handleField('location', e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">צבע</label>
        <button
          type="button"
          aria-label="צבע"
          onClick={cycleColor}
          style={{ backgroundColor: COURSE_COLORS[colorIdx] }}
          className="w-8 h-8 rounded-full border border-border cursor-pointer"
          title="לחץ לשינוי צבע"
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course-url">קישור</label>
        <Input
          id="course-url"
          aria-label="קישור"
          value={form.courseUrl}
          onChange={e => handleField('courseUrl', e.target.value)}
          dir="ltr"
          placeholder="https://moodle..."
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="course-notes">הערות</label>
        <Input
          id="course-notes"
          aria-label="הערות"
          value={form.notes}
          onChange={e => handleField('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-3 justify-end mt-1">
        <button aria-label="ביטול" onClick={onClose} className="text-sm text-muted-foreground">ביטול</button>
        <Button aria-label="הוסף קורס" size="sm" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
          {saving ? 'שומר...' : 'הוסף'}
        </Button>
      </div>
    </div>
  )
}
