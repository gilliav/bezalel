# Dashboard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `Dashboard.jsx` to modern React standards (no `<span>`, readable, split into files), fix the bug where projects with milestones but no top-level `dueDate` are excluded from display, and note domain knowledge for future agents.

**Architecture:** Extract `DashboardItem` into its own component file. Move `splitIntoTiers` into `src/utils/tiers.js`. Fix `projectItems` filter in `Dashboard.jsx` to exclude projects that already have milestones (since their milestones appear as rows already). Delete `Dashboard.test.jsx` as requested.

**Tech Stack:** React 18, React Router v6, Firestore Timestamps, Tailwind CSS, Lucide React icons.

---

## Domain Knowledge (Read This First)

**Projects with milestones:** A project may have child milestones stored in a Firestore subcollection (`projects/{id}/milestones`). These projects often have **no top-level `dueDate`** — the milestones are the deadlines. `useMilestones()` fetches all milestones via `collectionGroup` and each milestone carries `projectId`, `projectTitle`, and `courseId`. In the Dashboard, milestone rows render as `ProjectName › MilestoneName`. A project with milestones should **never** appear as a duplicate standalone row — only its milestones represent it. A project with **no milestones and a top-level `dueDate`** appears as a standalone row.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/tiers.js` | **Create** | Pure `splitIntoTiers` function |
| `src/components/DashboardItem.jsx` | **Create** | Single deadline row, milestone or project |
| `src/screens/Dashboard.jsx` | **Modify** | Thin orchestrator: load data, compute tiers, render sections. Fix project filter. |
| `src/screens/Dashboard.test.jsx` | **Delete** | Removed per user request |

---

## Task 1: Create `src/utils/tiers.js`

Move the pure `splitIntoTiers` function out of the screen file into a testable utility.

**Files:**
- Create: `src/utils/tiers.js`

- [ ] **Step 1: Create the file**

```js
// src/utils/tiers.js

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
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/tiers.js
git commit -m "feat: extract splitIntoTiers to src/utils/tiers.js"
```

---

## Task 2: Create `src/components/DashboardItem.jsx`

Extract the `DashboardItem` component from `Dashboard.jsx` into its own file. Replace all `<span>` with semantic elements (`<p>`, `<strong>`, `<time>`, etc.).

**Files:**
- Create: `src/components/DashboardItem.jsx`

- [ ] **Step 1: Create the component**

```jsx
// src/components/DashboardItem.jsx
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import { isOverdue, formatDateHe } from '../utils/dates'
import { Tag } from './ui/tag'

export function DashboardItem({ item, course }) {
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
              <strong className="font-display font-bold text-base text-foreground whitespace-nowrap shrink-0">
                {item.projectTitle}
              </strong>
              <p className="mx-1.5 text-sm shrink-0 text-muted-foreground">›</p>
              <p className="text-base text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {item.title}
              </p>
            </>
          ) : (
            <strong className="font-display font-bold text-base text-foreground">
              {item.title}
            </strong>
          )}
        </div>
        {course && <Tag value={course.name} color={course.color} />}
      </div>
      <p className={`flex gap-1 items-center text-sm ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Calendar className="size-3" />
        {formatDateHe(item.dueDate)}
      </p>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardItem.jsx
git commit -m "feat: extract DashboardItem component, replace span with semantic elements"
```

---

## Task 3: Refactor `Dashboard.jsx` and fix project filter

Replace the local `DashboardItem` and `splitIntoTiers` with the extracted versions. Fix the `projectItems` filter so projects that already have milestones are excluded (they appear via their milestone rows). Delete `Dashboard.test.jsx`.

**Files:**
- Modify: `src/screens/Dashboard.jsx`
- Delete: `src/screens/Dashboard.test.jsx`

- [ ] **Step 1: Rewrite `Dashboard.jsx`**

```jsx
// src/screens/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMilestones } from '../hooks/useMilestones'
import { useCourses } from '../hooks/useCourses'
import { useAllProjects } from '../hooks/useProjects'
import { splitIntoTiers } from '../utils/tiers'
import { DashboardItem } from '../components/DashboardItem'
import { SectionTier } from '../components/SectionTier'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'

export default function Dashboard({ onError }) {
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
            <p className="tier-label">
              פרויקטים ישנים ({past.length}) {pastExpanded ? '▴' : '▾'}
            </p>
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
```

- [ ] **Step 2: Delete the test file**

```bash
rm src/screens/Dashboard.test.jsx
```

- [ ] **Step 3: Verify the app starts without errors**

```bash
npm run dev
```

Open the Dashboard in the browser. Confirm:
- Projects with milestones only show their milestone rows (no duplicate project row)
- Projects with only a top-level `dueDate` and no milestones show as a standalone row
- No console errors

- [ ] **Step 4: Commit**

```bash
git add src/screens/Dashboard.jsx
git rm src/screens/Dashboard.test.jsx
git commit -m "refactor: Dashboard — extract components, fix project filter for milestone-only projects"
```

---

## Self-Review

- **Spec coverage:** All 5 design points covered: extract `DashboardItem` ✓, move `splitIntoTiers` ✓, delete test ✓, fix project filter ✓, thin orchestrator ✓.
- **Placeholders:** None.
- **Type consistency:** `item` shape is consistent across tasks — `{ id, projectId, title, projectTitle, dueDate, courseId }`. `course` is `{ id, name, color }`. All match existing data from hooks.
- **Domain note:** Included in the plan header and as an inline comment in the code for future agents.
