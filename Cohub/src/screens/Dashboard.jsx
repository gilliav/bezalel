import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { useAllProjects } from '../hooks/useProjects'
import { isOverdue } from '../utils/dates'
import { SectionTier } from '../components/SectionTier'
import { ProjectRow } from '../components/ProjectRow'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'

// Returns the next upcoming (non-overdue) milestone for a project, with its 1-based index.
function getNextMilestone(projectId, milestones) {
  const projectMs = milestones
    .filter(m => m.projectId === projectId)
    .sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate())

  const nextIdx = projectMs.findIndex(m => !isOverdue(m.dueDate))
  if (nextIdx === -1) return null

  const ms = projectMs[nextIdx]
  return { title: ms.title, index: nextIdx + 1, dueDate: ms.dueDate }
}

function effectiveDate(project, nextMilestone) {
  if (nextMilestone) return nextMilestone.dueDate
  return project.dueDate ?? null
}

// Splits projects into tiers. If fewer than 2 in 7-day window, expands to 14 days.
export function splitIntoTiers(projects, milestonesByProject) {
  const now = new Date()
  const day = 86_400_000

  const withDates = projects
    .map(p => ({ project: p, next: milestonesByProject[p.id] ?? null }))
    .filter(({ project, next }) => effectiveDate(project, next) !== null)

  const past = []
  const upcoming7 = []
  const upcoming14 = []
  const later = []

  for (const item of withDates) {
    const date = effectiveDate(item.project, item.next).toDate()
    if (date < now) {
      past.push(item)
    } else {
      const daysUntil = (date - now) / day
      if (daysUntil <= 7) upcoming7.push(item)
      else if (daysUntil <= 14) upcoming14.push(item)
      else later.push(item)
    }
  }

  const hotItems = upcoming7.length >= 2
    ? upcoming7
    : [...upcoming7, ...upcoming14]

  return {
    hot: hotItems.sort((a, b) => effectiveDate(a.project, a.next).toDate() - effectiveDate(b.project, b.next).toDate()),
    later: later.sort((a, b) => effectiveDate(a.project, a.next).toDate() - effectiveDate(b.project, b.next).toDate()),
    past: past.sort((a, b) => effectiveDate(b.project, b.next).toDate() - effectiveDate(a.project, a.next).toDate()),
  }
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

  const milestonesByProject = Object.fromEntries(
    projects.map(p => [p.id, getNextMilestone(p.id, milestones)])
  )

  const { hot, later, past } = splitIntoTiers(projects, milestonesByProject)

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
          {hot.map(({ project, next }) => (
            <ProjectRow
              key={project.id}
              project={project}
              course={courseMap[project.courseId]}
              nextMilestone={next}
            />
          ))}
        </section>
      )}

      {later.length > 0 && (
        <section>
          <SectionTier label="בהמשך" variant="normal" />
          {later.map(({ project, next }) => (
            <ProjectRow
              key={project.id}
              project={project}
              course={courseMap[project.courseId]}
              nextMilestone={next}
            />
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
          {pastExpanded && past.map(({ project, next }) => (
            <ProjectRow
              key={project.id}
              project={project}
              course={courseMap[project.courseId]}
              nextMilestone={next}
            />
          ))}
        </section>
      )}
    </div>
  )
}
