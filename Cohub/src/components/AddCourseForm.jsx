import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { COURSE_COLORS } from '../utils/colors'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { dayIndexToHe } from '../utils/dates'

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

function firstUnusedColor(usedColors) {
  const used = new Set(usedColors)
  return COURSE_COLORS.find(c => !used.has(c)) ?? COURSE_COLORS[0]
}

export function AddCourseForm({ courses, onClose, onError }) {
  const usedColors = courses.map(c => c.color).filter(Boolean)
  const [isOnline, setIsOnline] = useState(false)
  const [selectedColor, setSelectedColor] = useState(() => firstUnusedColor(usedColors))
  const [customHex, setCustomHex] = useState('')
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

  const activeColor = customHex.match(/^#[0-9A-Fa-f]{6}$/) ? customHex : selectedColor

  function handleField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handlePaletteClick(color) {
    setSelectedColor(color)
    setCustomHex('')
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        lecturer: form.lecturer,
        courseUrl: form.courseUrl,
        notes: form.notes,
        color: activeColor,
        isOnline,
      }
      if (!isOnline) {
        payload.day = Number(form.day)
        payload.hours = form.hours
        payload.location = form.location
      }
      await addDoc(collection(db, 'courses'), payload)
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="course-online"
          aria-label="קורס מקוון"
          checked={isOnline}
          onChange={e => setIsOnline(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="course-online" className="text-sm text-foreground cursor-pointer">קורס מקוון</label>
      </div>

      {!isOnline && (
        <>
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
            <label className="field-label" htmlFor="course-location">מיקום</label>
            <Input
              id="course-location"
              aria-label="מיקום"
              value={form.location}
              onChange={e => handleField('location', e.target.value)}
            />
          </div>
        </>
      )}

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
        <label className="field-label">צבע</label>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="בחירת צבע">
          {COURSE_COLORS.map(color => {
            const isUsed = usedColors.includes(color)
            const isSelected = activeColor === color && !customHex.match(/^#[0-9A-Fa-f]{6}$/)
            return (
              <span key={color} data-used={isUsed ? 'true' : undefined}>
                <input
                  type="radio"
                  name="course-color"
                  value={color}
                  aria-label={color}
                  checked={isSelected}
                  onChange={() => handlePaletteClick(color)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => handlePaletteClick(color)}
                  style={{ backgroundColor: color, opacity: isUsed ? 0.4 : 1 }}
                  className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  title={color}
                  aria-label={color}
                />
              </span>
            )
          })}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div
            className="w-6 h-6 rounded-full border border-border flex-shrink-0"
            style={{ backgroundColor: activeColor }}
          />
          <Input
            id="course-custom-color"
            aria-label="צבע מותאם אישית"
            value={customHex}
            onChange={e => setCustomHex(e.target.value)}
            dir="ltr"
            placeholder="#A8DADC"
            className="w-32 font-mono text-sm"
          />
        </div>
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
