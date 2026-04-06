import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { useAllProjects } from '../hooks/useProjects'
import { isOverdue, formatDateHe } from '../utils/dates'
import { Tag } from '../components/ui/tag'
import { SectionTier } from '../components/SectionTier'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Calendar } from 'lucide-react'

// Splits a flat list of deadline items into tiers by date.
// If fewer than 2 items fall within 7 days, expands hot window to 14 days.
export function splitIntoTiers(items) {
  const now = new Date()
  const day = 86_400_000

  const past = []
  const upcoming7 = []
  const upcoming14 = []
  const later = []

  for (const item of items) {
    const date = item.dueDate.toDate()
    if (date < now) {
      past.push(item)
    } else {
      const daysUntil = (date - now) / day
      if (daysUntil <= 7) upcoming7.push(item)
      else if (daysUntil <= 14) upcoming14.push(item)
      else later.push(item)
    }
  }

  const sort = arr => [...arr].sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate())
  const sortDesc = arr => [...arr].sort((a, b) => b.dueDate.toDate() - a.dueDate.toDate())

  const hotItems = upcoming7.length >= 2 ? upcoming7 : [...upcoming7, ...upcoming14]
  const laterItems = upcoming7.length >= 2 ? [...upcoming14, ...later] : later

  return {
    hot: sort(hotItems),
    later: sort(laterItems),
    past: sortDesc(past),
  }
}

function DashboardItem({ item, course }) {
  const overdue = isOverdue(item.dueDate)
  const isMilestone = Boolean(item.projectTitle)
  return (
    <Link
      to={`/projects/${item.projectId}`}
      className={`list-row-stacked ${overdue ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-0 overflow-hidden min-w-0">
          {isMilestone ? (
            <>
              <span className="font-display font-bold text-base text-foreground whitespace-nowrap shrink-0">
                {item.projectTitle}
              </span>
              <span className="mx-1.5 text-sm shrink-0 text-muted-foreground">›</span>
              <span className="text-base text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {item.title}
              </span>
            </>
          ) : (
            <span className="font-display font-bold text-base text-foreground">{item.title}</span>
          )}
        </div>
        {course && (
          <Tag value={course.name} color={course.color} />
        )}
      </div>
      <div className={`flex gap-1 items-center text-sm ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Calendar className="size-3" />
        {formatDateHe(item.dueDate)}
      </div>
    </Link>
  )
}

export default function Dashboard({ onError }) {
  const { milestones, loading: mlLoading, error: mlError } = useMilestones()
  const { courses, loading: cLoading, error: cError } = useCourses()
  const { projects, loading: pLoading, error: pError } = useAllProjects()
  const [pastExpanded, setPastExpanded] = useState(false)

  useEffect(() => {
    if (mlError || cError || pError) onError?.('שגיאה בטעינת הנתונים')
  }, [mlError, cError, pError, onError])

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))

  // Single-deadline projects (no milestones shown — they appear via their milestones)
  // A project appears as an item only if it has a dueDate
  const projectItems = projects
    .filter(p => p.dueDate)
    .map(p => ({
      id: `project-${p.id}`,
      projectId: p.id,
      title: p.title,
      projectTitle: '',
      dueDate: p.dueDate,
      courseId: p.courseId,
    }))

  const allItems = [...milestones, ...projectItems]

  const { hot, later, past } = splitIntoTiers(allItems)

  if (mlLoading || cLoading || pLoading) {
    return <div className="state-loading">טוען...</div>
  }

  const hasContent = hot.length > 0 || later.length > 0 || past.length > 0

  return (
    <div className="text-right">
      <PageHeader
        title="הגשות"
        action={<Link to="/projects/new" className="action-link text-sm">+ פרויקט חדש</Link>}
      />

      {!hasContent && <EmptyState message="אין פרויקטים פעילים" />}

      {hot.length > 0 && (
        <section>
          <SectionTier label="השבוע" variant="hot" />
          {hot.map(item => (
            <DashboardItem key={item.id} item={item} course={courseMap[item.courseId]} />
          ))}
        </section>
      )}

      {later.length > 0 && (
        <section>
          <SectionTier label="בהמשך" variant="normal" />
          {later.map(item => (
            <DashboardItem key={item.id} item={item} course={courseMap[item.courseId]} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section>
          <button
            onClick={() => setPastExpanded(e => !e)}
            className="tier-row w-full text-right"
          >
            <span className="tier-label">
              פרויקטים ישנים ({past.length}) {pastExpanded ? '▴' : '▾'}
            </span>
            <div className="tier-line" />
          </button>
          {pastExpanded && past.map(item => (
            <DashboardItem key={item.id} item={item} course={courseMap[item.courseId]} />
          ))}
        </section>
      )}
    </div>
  )
}
