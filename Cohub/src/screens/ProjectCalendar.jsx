// src/screens/ProjectCalendar.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronsLeftIcon, PlusIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { useAllProjects } from '../hooks/useProjects'
import { buildDueItems } from '../utils/dueItems'
import { dateKey, monthWeeks, groupByDay, formatMonthHe, formatDayHe } from '../utils/calendar'
import { PageHeader } from '../components/PageHeader'
import { SectionTier } from '../components/SectionTier'
import { EmptyState } from '../components/EmptyState'
import { AuthSlot } from '../components/AuthSlot'
import { ProjectsViewToggle } from '../components/ProjectsViewToggle'
import { IconButton } from '../components/ui/IconButton'
import { CourseIcon } from '../components/CourseIcon'

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MAX_ICONS = 2

export default function ProjectCalendar() {
  const { user, signIn, signOut } = useAuth()
  const { milestones, loading: mlLoading } = useMilestones()
  const { courses, loading: cLoading } = useCourses()
  const { projects, loading: pLoading } = useAllProjects()

  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedKey, setSelectedKey] = useState(null)

  if (mlLoading || cLoading || pLoading) {
    return <div className="state-loading"/>
  }

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))
  const byDay = groupByDay(buildDueItems(milestones, projects, courseMap))
  const weeks = monthWeeks(view.year, view.month)
  const todayKey = dateKey(today)

  function shiftMonth(delta) {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    setSelectedKey(null)
  }

  // With a day selected, list that day; otherwise list the whole visible month.
  const monthDays = weeks.flat().filter(Boolean)
  const listedDays = selectedKey
    ? monthDays.filter(d => dateKey(d) === selectedKey)
    : monthDays.filter(d => byDay[dateKey(d)])

  const authSlot = <AuthSlot user={user} signIn={signIn} signOut={signOut} />

  return (
    <div className="text-right">
      <PageHeader
        title="הגשות"
        action={<Link to="/projects/new" className="inline-flex items-baseline gap-1 action-link text-sm"><PlusIcon size={14} className='self-center' /> פרויקט חדש</Link>}
        authSlot={authSlot}
      />
      <ProjectsViewToggle />

      <div className="flex items-center justify-between px-4 py-3">
        <IconButton icon={ChevronRight} size={20} onClick={() => shiftMonth(-1)} aria-label="חודש קודם" />
        <h2>{formatMonthHe(view.year, view.month)}</h2>
        <IconButton icon={ChevronLeft} size={20} onClick={() => shiftMonth(1)} aria-label="חודש הבא" />
      </div>

      <div className="grid grid-cols-7 px-2 text-center">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-xs text-muted-foreground pb-1">{day}</div>
        ))}
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />
          const key = dateKey(date)
          const items = byDay[key] ?? []
          const isSelected = key === selectedKey
          const isToday = key === todayKey
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(isSelected ? null : key)}
              aria-pressed={isSelected}
              aria-label={`${formatDayHe(date)}${items.length ? `, ${items.length} הגשות` : ''}`}
              className={`flex flex-col items-center gap-1 py-1.5 min-h-[3rem] border ${
                isSelected ? 'border-foreground' : 'border-transparent'
              }`}
            >
              <span className={`flex items-center justify-center size-6 text-sm leading-none rounded-full text-foreground ${isToday ? 'border border-foreground' : ''}`}>
                {date.getDate()}
              </span>
              {items.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {items.slice(0, MAX_ICONS).map(item => (
                    <CourseIcon
                      key={item.id}
                      course={courseMap[item.courseId]}
                      data-testid="day-icon"
                      className="size-[18px]"
                    />
                  ))}
                  {items.length > MAX_ICONS && (
                    <span className="text-[10px] leading-none text-muted-foreground">+{items.length - MAX_ICONS}</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3">
        {listedDays.length === 0 && (
          <EmptyState message={selectedKey ? 'אין הגשות ביום הזה' : 'אין הגשות החודש'} />
        )}
        {listedDays.map(date => {
          const key = dateKey(date)
          const items = byDay[key] ?? []
          return (
            <section key={key}>
              <SectionTier label={formatDayHe(date)} variant="normal" />
              {items.length === 0 && <EmptyState message="אין הגשות ביום הזה" />}
              {items.map(item => {
                const course = courseMap[item.courseId]
                return (
                  <Link key={item.id} to={`/projects/${item.projectId}`} className="list-row">
                    <CourseIcon course={course} />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1">
                        {item.projectTitle ? (
                          <>
                            <span className="text-base text-foreground leading-tight">{item.projectTitle}</span>
                            <ChevronsLeftIcon className="size-3 shrink-0" />
                            <span className="text-base text-foreground leading-tight">{item.title}</span>
                          </>
                        ) : (
                          <span className="text-base text-foreground leading-tight">{item.title}</span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{course.name}</span>
                    </div>
                  </Link>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
