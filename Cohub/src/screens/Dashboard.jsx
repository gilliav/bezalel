// src/screens/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { useAllProjects } from '../hooks/useProjects'
import { splitIntoTiers } from '../utils/tiers'
import { DashboardItem } from '../components/DashboardItem'
import { SectionTier } from '../components/SectionTier'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'

export default function Dashboard({ onError }) {
  const { user, signIn, signOut } = useAuth()
  const { progressMap, setProgress } = useProgress(user?.uid ?? null)
  const { milestones, loading: mlLoading, error: mlError } = useMilestones()
  const { courses, loading: cLoading, error: cError } = useCourses()
  const { projects, loading: pLoading, error: pError } = useAllProjects()
  const [pastExpanded, setPastExpanded] = useState(false)

  useEffect(() => {
    if (mlError || cError || pError) onError?.('שגיאה בטעינת הנתונים')
  }, [mlError, cError, pError, onError])

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]))

  // Projects that have milestones are represented via their milestone rows.
  // Only include a project as a standalone item if it has a top-level dueDate
  // AND no milestones attached to it.
  // See: docs/superpowers/plans/2026-04-07-dashboard-refactor.md — Domain Knowledge
  const projectsWithMilestones = new Set(milestones.map(m => m.projectId))
  const projectItems = projects
    .filter(p => p.dueDate && !projectsWithMilestones.has(p.id))
    .map(p => ({
      id: `project-${p.id}`,
      projectId: p.id,
      title: p.title,
      projectTitle: '',
      dueDate: p.dueDate,
      courseId: p.courseId,
    }))

  // Only include items that have a valid dueDate (guard against corrupt data)
  const allItems = [...milestones, ...projectItems].filter(i => i.dueDate?.toDate)

  const { hot, later, past } = splitIntoTiers(allItems)

  if (mlLoading || cLoading || pLoading) {
    return <div className="state-loading">טוען...</div>
  }

  const hasContent = hot.length > 0 || later.length > 0 || past.length > 0

  const authSlot = user === undefined ? null : user ? (
    <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
      {user.photoURL && (
        <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
      )}
      <span className="text-xs">{user.displayName?.split(' ')[0]}</span>
    </button>
  ) : (
    <button onClick={signIn} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      התחבר
    </button>
  )

  return (
    <div className="text-right">
      <PageHeader
        title="הגשות"
        action={<Link to="/projects/new" className="action-link text-sm">+ פרויקט חדש</Link>}
        authSlot={authSlot}
      />

      {!hasContent && <EmptyState message="אין פרויקטים פעילים" />}

      {hot.length > 0 && (
        <section className="flex flex-col">
          <SectionTier label="השבוע" variant="hot" />
          {hot.map(item => {
            const isMilestone = Boolean(item.projectTitle)
            const status = user ? (progressMap[item.id] ?? 'not_started') : 'not_started'
            return (
              <DashboardItem
                key={item.id}
                item={item}
                course={courseMap[item.courseId]}
                progressStatus={status}
                onProgressSelect={user ? (newStatus) => setProgress(item.id, isMilestone ? 'milestone' : 'project', newStatus) : undefined}
                onSignInPrompt={user === null ? signIn : undefined}
              />
            )
          })}
        </section>
      )}

      {later.length > 0 && (
        <section className="flex flex-col">
          <SectionTier label="בהמשך" variant="normal" />
          {later.map(item => {
            const isMilestone = Boolean(item.projectTitle)
            const status = user ? (progressMap[item.id] ?? 'not_started') : 'not_started'
            return (
              <DashboardItem
                key={item.id}
                item={item}
                course={courseMap[item.courseId]}
                progressStatus={status}
                onProgressSelect={user ? (newStatus) => setProgress(item.id, isMilestone ? 'milestone' : 'project', newStatus) : undefined}
                onSignInPrompt={user === null ? signIn : undefined}
              />
            )
          })}
        </section>
      )}

      {past.length > 0 && (
        <section>
          <button
            onClick={() => setPastExpanded(e => !e)}
            className="tier-row w-full text-right"
          >
            <span className="tier-label">
              הגשות קודמות ({past.length}) {pastExpanded ?  '▲'  : '▼'}
            </span>
          </button>
          {pastExpanded && past.map(item => {
            const isMilestone = Boolean(item.projectTitle)
            const status = user ? (progressMap[item.id] ?? 'not_started') : 'not_started'
            return (
              <DashboardItem
                key={item.id}
                item={item}
                course={courseMap[item.courseId]}
                progressStatus={status}
                onProgressSelect={user ? (newStatus) => setProgress(item.id, isMilestone ? 'milestone' : 'project', newStatus) : undefined}
                onSignInPrompt={user === null ? signIn : undefined}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}
