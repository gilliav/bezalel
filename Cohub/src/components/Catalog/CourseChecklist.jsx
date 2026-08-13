import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function CourseChecklist({ courses, excludeIds, onDone }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())

  const availableCourses = useMemo(
    () => courses.filter(c => !excludeIds.has(c.id)),
    [courses, excludeIds],
  )

  const filteredCourses = useMemo(() => {
    const term = search.trim()
    if (!term) return availableCourses
    return availableCourses.filter(c => c.name.includes(term) || c.lecturer?.includes(term))
  }, [availableCourses, search])

  function toggle(courseId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  return (
    <div className="text-right">
      <div className="page-body pb-2">
        <p className="text-base text-muted-foreground">
          סמנו את הקורסים שלמדתם, ואז דרגו אותם אחד אחד
        </p>
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם קורס או מרצה"
        />
      </div>
      <div>
        {filteredCourses.map(course => (
          <label key={course.id} className="list-row items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(course.id)}
              onChange={() => toggle(course.id)}
              aria-label={course.name}
              className="w-5 h-5"
            />
            <div className="flex flex-col">
              <span className="text-base text-foreground">{course.name}</span>
              <span className="text-sm text-muted-foreground">{course.lecturer}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="page-body">
        <Button onClick={() => onDone(Array.from(selected))} disabled={selected.size === 0}>
          סיימתי, התחילו לדרג ({selected.size})
        </Button>
      </div>
    </div>
  )
}
