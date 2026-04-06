# UI Refactor & Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor all Cohub screens to a sharp, minimalist design system with small focused components, so students can instantly understand upcoming deadlines at a glance.

**Architecture:** Build atomic components first (UrgencyPill, CourseTag, SectionTier, PageHeader, EmptyState), then the core ProjectRow, then rewrite Dashboard with new tier logic, then apply the design system to remaining screens. Each task is independently testable and committable.

**Tech Stack:** React 18, Tailwind CSS, Vitest + React Testing Library, Firebase Firestore (data layer untouched), React Router v6, RTL (direction: rtl).

---

## File Map

**Create:**
- `src/components/UrgencyPill.jsx` + `src/components/UrgencyPill.test.jsx`
- `src/components/CourseTag.jsx` + `src/components/CourseTag.test.jsx`
- `src/components/SectionTier.jsx` + `src/components/SectionTier.test.jsx`
- `src/components/PageHeader.jsx` + `src/components/PageHeader.test.jsx`
- `src/components/EmptyState.jsx` + `src/components/EmptyState.test.jsx`
- `src/components/ProjectRow.jsx` + `src/components/ProjectRow.test.jsx`

**Modify:**
- `src/index.css` — update CSS vars, add utility classes
- `src/screens/Dashboard.jsx` — full rewrite
- `src/screens/ProjectDetail.jsx` — apply design system
- `src/screens/ProjectForm.jsx` — apply design system
- `src/screens/Schedule.jsx` — use SectionTier
- `src/screens/CoursesList.jsx` — align to design system
- `src/components/CourseCard.jsx` — align to design system

**Delete:**
- `src/components/MilestoneItem.jsx` + `src/components/MilestoneItem.test.jsx`

**Unchanged:** `src/components/ui/tag.jsx` (kept as-is, CourseTag is a new component), Timeline components, hooks, firebase.js, BottomNav, Toast, ConnectionBanner.

---

## Task 1: Update CSS design tokens

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Update CSS custom properties and add utility classes**

Replace the entire `:root` block and `@layer components` in `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 36 28% 96%;          /* #f7f3ec */
    --foreground: 20 5% 10%;           /* #1a1714 */
    --card: 36 28% 96%;
    --card-foreground: 20 5% 10%;
    --primary: 20 5% 10%;              /* #1a1714 — sharp black */
    --primary-foreground: 36 28% 96%;  /* #f7f3ec */
    --muted: 36 18% 88%;               /* #e8e2d6 */
    --muted-foreground: 20 5% 42%;     /* rgba(26,23,20,0.42) approx */
    --border: 20 5% 10% / 0.09;        /* rgba(26,23,20,0.09) */
    --destructive: 4 65% 46%;          /* #c0392b */
    --destructive-foreground: 0 0% 100%;
    --radius: 0px;
    font-size: 18px;
  }

  body {
    @apply font-body text-foreground text-xl;
    direction: rtl;
    background-color: #f7f3ec;
  }

  h1 {
    @apply font-display text-2xl font-bold;
  }

  h2 {
    @apply font-display text-xl font-bold text-foreground;
  }

  h3 {
    @apply font-display text-lg font-bold text-foreground;
  }

  label {
    @apply font-display text-sm font-bold text-muted-foreground;
  }
}

@layer components {
  /* Page structure */
  .page-header {
    @apply flex items-center justify-between px-4 py-3;
    border-bottom: 2px solid #1a1714;
  }

  .page-body {
    @apply flex flex-col gap-4 px-4 py-4;
  }

  /* List rows */
  .list-row {
    @apply flex items-center gap-3 px-4 py-3;
    border-bottom: 1px solid rgba(26,23,20,0.09);
  }

  .list-row-stacked {
    @apply flex flex-col gap-0.5 px-4 py-3;
    border-bottom: 1px solid rgba(26,23,20,0.09);
  }

  /* Section tier (label + hairline) */
  .tier-row {
    @apply flex items-center gap-2.5 px-4 py-2;
  }

  .tier-line {
    flex: 1;
    height: 1px;
    background: rgba(26,23,20,0.12);
  }

  .tier-label {
    @apply font-display text-[10px] font-bold tracking-[0.14em] uppercase whitespace-nowrap;
    color: rgba(26,23,20,0.32);
  }

  .tier-label-hot {
    @apply font-display text-[10px] font-bold tracking-[0.14em] uppercase whitespace-nowrap;
    color: #b83220;
  }

  /* Urgency pills */
  .pill {
    @apply inline-flex items-center text-[11px] font-bold px-2 py-0.5 whitespace-nowrap flex-shrink-0;
    border-radius: 2px;
    border: 1.5px solid;
  }

  .pill-dark {
    background: #1a1714;
    color: #f7f3ec;
    border-color: #1a1714;
  }

  .pill-muted {
    background: transparent;
    color: rgba(26,23,20,0.4);
    border-color: rgba(26,23,20,0.18);
  }

  .pill-danger {
    background: #c0392b;
    color: #fff;
    border-color: #c0392b;
  }

  /* Form elements */
  .field {
    @apply flex flex-col gap-1;
  }

  .field-label {
    @apply text-base text-muted-foreground;
  }

  .field-input {
    @apply w-full border border-border px-3 py-2 text-base text-right bg-card
           focus:outline-none focus:ring-2 focus:ring-primary/40;
    border-radius: 0;
  }

  /* Loading / empty states */
  .state-empty {
    @apply p-8 text-center text-base text-muted-foreground;
  }

  .state-loading {
    @apply p-4 text-right text-muted-foreground;
  }

  /* Action link */
  .action-link {
    @apply text-base text-primary font-medium;
  }

  /* Inline color dot */
  .color-dot {
    @apply w-3 h-3 rounded-full shrink-0;
  }

  /* Section label (legacy, keep for CourseDetail) */
  .section-label {
    @apply px-4 py-2 text-sm font-semibold uppercase tracking-wide;
  }
}
```

- [ ] **Step 2: Run the app and verify it loads without errors**

```bash
cd /Users/gilli/dev/Bezalel/Cohub && npm run dev
```

Open browser and confirm the app renders (styling will look different — that's expected).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: update design tokens — sharp radius, new pill/tier utilities"
```

---

## Task 2: UrgencyPill component

**Files:**
- Create: `src/components/UrgencyPill.jsx`
- Create: `src/components/UrgencyPill.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/UrgencyPill.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { UrgencyPill } from './UrgencyPill'

it('renders the label text', () => {
  render(<UrgencyPill label="מחר" variant="dark" />)
  expect(screen.getByText('מחר')).toBeInTheDocument()
})

it('applies pill-dark class for dark variant', () => {
  const { container } = render(<UrgencyPill label="מחר" variant="dark" />)
  expect(container.firstChild).toHaveClass('pill-dark')
})

it('applies pill-muted class for muted variant', () => {
  const { container } = render(<UrgencyPill label="בעוד חודש" variant="muted" />)
  expect(container.firstChild).toHaveClass('pill-muted')
})

it('applies pill-danger class for danger variant', () => {
  const { container } = render(<UrgencyPill label="עבר הדדליין" variant="danger" />)
  expect(container.firstChild).toHaveClass('pill-danger')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/gilli/dev/Bezalel/Cohub && npx vitest run src/components/UrgencyPill.test.jsx
```

Expected: FAIL — "Cannot find module './UrgencyPill'"

- [ ] **Step 3: Implement UrgencyPill**

Create `src/components/UrgencyPill.jsx`:

```jsx
const VARIANT_CLASS = {
  dark: 'pill-dark',
  muted: 'pill-muted',
  danger: 'pill-danger',
}

export function UrgencyPill({ label, variant }) {
  return (
    <span className={`pill ${VARIANT_CLASS[variant]}`}>{label}</span>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/UrgencyPill.test.jsx
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/UrgencyPill.jsx src/components/UrgencyPill.test.jsx
git commit -m "feat: add UrgencyPill component"
```

---

## Task 3: CourseTag component

**Files:**
- Create: `src/components/CourseTag.jsx`
- Create: `src/components/CourseTag.test.jsx`

Renders course name with underline in course color. Optionally a link.

- [ ] **Step 1: Write failing tests**

Create `src/components/CourseTag.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CourseTag } from './CourseTag'

it('renders the course name', () => {
  render(<CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" />)
  expect(screen.getByText('עיצוב גרפי א׳')).toBeInTheDocument()
})

it('applies border-bottom in course color via inline style', () => {
  const { container } = render(<CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" />)
  expect(container.firstChild).toHaveStyle('border-bottom: 1.5px solid #b8ddb0')
})

it('renders a link when to prop is provided', () => {
  render(
    <MemoryRouter>
      <CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" to="/courses/c1" />
    </MemoryRouter>
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/c1')
})

it('renders a span (not a link) when to prop is omitted', () => {
  const { container } = render(<CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" />)
  expect(container.firstChild.tagName).toBe('SPAN')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/CourseTag.test.jsx
```

Expected: FAIL — "Cannot find module './CourseTag'"

- [ ] **Step 3: Implement CourseTag**

Create `src/components/CourseTag.jsx`:

```jsx
import { Link } from 'react-router-dom'

const tagStyle = (color) => ({
  fontSize: '11px',
  fontWeight: 600,
  paddingBottom: '1px',
  borderBottom: `1.5px solid ${color}`,
  color,
  display: 'inline-block',
  lineHeight: 1.4,
})

export function CourseTag({ name, color, to }) {
  if (to) {
    return (
      <Link to={to} style={tagStyle(color)}>
        {name}
      </Link>
    )
  }
  return (
    <span style={tagStyle(color)}>
      {name}
    </span>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/CourseTag.test.jsx
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/CourseTag.jsx src/components/CourseTag.test.jsx
git commit -m "feat: add CourseTag component"
```

---

## Task 4: SectionTier component

**Files:**
- Create: `src/components/SectionTier.jsx`
- Create: `src/components/SectionTier.test.jsx`

Renders `[label text] ————————` with an extending hairline.

- [ ] **Step 1: Write failing tests**

Create `src/components/SectionTier.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { SectionTier } from './SectionTier'

it('renders the label text', () => {
  render(<SectionTier label="השבוע" variant="hot" />)
  expect(screen.getByText('השבוע')).toBeInTheDocument()
})

it('applies tier-label-hot class for hot variant', () => {
  render(<SectionTier label="השבוע" variant="hot" />)
  expect(screen.getByText('השבוע')).toHaveClass('tier-label-hot')
})

it('applies tier-label class for normal variant', () => {
  render(<SectionTier label="בהמשך" variant="normal" />)
  expect(screen.getByText('בהמשך')).toHaveClass('tier-label')
})

it('renders the hairline element', () => {
  const { container } = render(<SectionTier label="בהמשך" variant="normal" />)
  expect(container.querySelector('.tier-line')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/SectionTier.test.jsx
```

Expected: FAIL — "Cannot find module './SectionTier'"

- [ ] **Step 3: Implement SectionTier**

Create `src/components/SectionTier.jsx`:

```jsx
export function SectionTier({ label, variant }) {
  return (
    <div className="tier-row">
      <span className={variant === 'hot' ? 'tier-label-hot' : 'tier-label'}>
        {label}
      </span>
      <div className="tier-line" />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/SectionTier.test.jsx
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/SectionTier.jsx src/components/SectionTier.test.jsx
git commit -m "feat: add SectionTier component"
```

---

## Task 5: PageHeader and EmptyState components

**Files:**
- Create: `src/components/PageHeader.jsx`
- Create: `src/components/PageHeader.test.jsx`
- Create: `src/components/EmptyState.jsx`
- Create: `src/components/EmptyState.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/PageHeader.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

it('renders the title', () => {
  render(<PageHeader title="הגשות" />)
  expect(screen.getByRole('heading', { name: 'הגשות' })).toBeInTheDocument()
})

it('renders the action slot when provided', () => {
  render(<PageHeader title="הגשות" action={<button>+ חדש</button>} />)
  expect(screen.getByRole('button', { name: '+ חדש' })).toBeInTheDocument()
})

it('renders without action slot', () => {
  const { container } = render(<PageHeader title="מערכת שעות" />)
  expect(container.querySelector('button')).not.toBeInTheDocument()
})
```

Create `src/components/EmptyState.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

it('renders the message', () => {
  render(<EmptyState message="אין פרויקטים פעילים" />)
  expect(screen.getByText('אין פרויקטים פעילים')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/PageHeader.test.jsx src/components/EmptyState.test.jsx
```

Expected: FAIL — module not found for both.

- [ ] **Step 3: Implement PageHeader**

Create `src/components/PageHeader.jsx`:

```jsx
export function PageHeader({ title, action }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {action && <div>{action}</div>}
    </header>
  )
}
```

- [ ] **Step 4: Implement EmptyState**

Create `src/components/EmptyState.jsx`:

```jsx
export function EmptyState({ message }) {
  return <div className="state-empty">{message}</div>
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run src/components/PageHeader.test.jsx src/components/EmptyState.test.jsx
```

Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/components/PageHeader.jsx src/components/PageHeader.test.jsx \
        src/components/EmptyState.jsx src/components/EmptyState.test.jsx
git commit -m "feat: add PageHeader and EmptyState components"
```

---

## Task 6: ProjectRow component

**Files:**
- Create: `src/components/ProjectRow.jsx`
- Create: `src/components/ProjectRow.test.jsx`

The core dashboard row. Two layouts: with milestone (shows `01 MilestoneName ›`) and without (single deadline).

- [ ] **Step 1: Write failing tests**

Create `src/components/ProjectRow.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectRow } from './ProjectRow'

const course = { id: 'c1', name: 'עיצוב גרפי א׳', color: '#b8ddb0' }

const projectSingle = {
  id: 'p1',
  title: 'פרויקט צילום',
  courseId: 'c1',
  dueDate: { toDate: () => new Date('2099-05-01') },
}

const projectMulti = {
  id: 'p2',
  title: 'פוסטר טיפוגרפי',
  courseId: 'c1',
  dueDate: null,
}

const nextMilestone = { title: 'סקיצות ראשוניות', index: 1, dueDate: { toDate: () => new Date('2099-04-10') } }

function renderRow(project, milestone = null) {
  return render(
    <MemoryRouter>
      <ProjectRow project={project} course={course} nextMilestone={milestone} />
    </MemoryRouter>
  )
}

it('renders project title', () => {
  renderRow(projectSingle)
  expect(screen.getByText('פרויקט צילום')).toBeInTheDocument()
})

it('renders course name', () => {
  renderRow(projectSingle)
  expect(screen.getByText('עיצוב גרפי א׳')).toBeInTheDocument()
})

it('renders milestone with formatted index when nextMilestone provided', () => {
  renderRow(projectMulti, nextMilestone)
  expect(screen.getByText(/01/)).toBeInTheDocument()
  expect(screen.getByText(/סקיצות ראשוניות/)).toBeInTheDocument()
})

it('does not render milestone section when nextMilestone is null', () => {
  renderRow(projectSingle, null)
  expect(screen.queryByText(/›/)).not.toBeInTheDocument()
})

it('links to the project detail page', () => {
  renderRow(projectSingle)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/p1')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/components/ProjectRow.test.jsx
```

Expected: FAIL — "Cannot find module './ProjectRow'"

- [ ] **Step 3: Implement ProjectRow**

Create `src/components/ProjectRow.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { UrgencyPill } from './UrgencyPill'
import { CourseTag } from './CourseTag'
import { formatRelativeDateHe, isOverdue } from '../utils/dates'

function pillVariant(dueDate) {
  if (!dueDate) return 'muted'
  const date = dueDate.toDate()
  if (date < new Date()) return 'danger'
  const daysUntil = (date - new Date()) / 86_400_000
  return daysUntil <= 7 ? 'dark' : 'muted'
}

function formatIndex(n) {
  return String(n).padStart(2, '0')
}

export function ProjectRow({ project, course, nextMilestone }) {
  const dueDate = nextMilestone ? nextMilestone.dueDate : project.dueDate
  const label = formatRelativeDateHe(dueDate)
  const variant = pillVariant(dueDate)

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block relative border-b"
      style={{ borderColor: 'rgba(26,23,20,0.09)' }}
    >
      {/* Color accent stripe */}
      <div
        className="absolute top-0 right-0 w-1 h-full"
        style={{ background: course?.color }}
      />

      {/* Main row */}
      <div className="flex items-baseline justify-between gap-2 px-4 pt-2.5 pb-1 pr-5">
        <div className="flex items-baseline gap-0 overflow-hidden min-w-0">
          <span className="font-display font-bold text-base text-foreground whitespace-nowrap shrink-0">
            {project.title}
          </span>
          {nextMilestone && (
            <>
              <span className="mx-1.5 text-sm shrink-0" style={{ color: 'rgba(26,23,20,0.22)' }}>›</span>
              <span className="font-display font-bold text-base text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {formatIndex(nextMilestone.index)} {nextMilestone.title}
              </span>
            </>
          )}
        </div>
        <UrgencyPill label={label} variant={variant} />
      </div>

      {/* Course tag line */}
      <div className="px-4 pb-2.5 pr-5">
        <CourseTag
          name={course?.name}
          color={course?.color}
          to={`/courses/${course?.id}`}
        />
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/components/ProjectRow.test.jsx
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectRow.jsx src/components/ProjectRow.test.jsx
git commit -m "feat: add ProjectRow component"
```

---

## Task 7: Dashboard rewrite

**Files:**
- Modify: `src/screens/Dashboard.jsx`

Full rewrite with tier logic: השבוע / בהמשך / פרויקטים ישנים (collapsed).

- [ ] **Step 1: Write the tier logic helper as a pure function and test it**

Add to `src/screens/Dashboard.jsx` (write the whole file):

```jsx
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
// Milestones are sorted ascending by dueDate. Index is position in that sorted list.
function getNextMilestone(projectId, milestones) {
  const projectMs = milestones
    .filter(m => m.projectId === projectId)
    .sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate())

  const nextIdx = projectMs.findIndex(m => !isOverdue(m.dueDate))
  if (nextIdx === -1) return null

  const ms = projectMs[nextIdx]
  return { title: ms.title, index: nextIdx + 1, dueDate: ms.dueDate }
}

// Returns the effective "next deadline" date for tier placement.
function effectiveDate(project, nextMilestone) {
  if (nextMilestone) return nextMilestone.dueDate
  return project.dueDate ?? null
}

// Splits projects into tiers: upcoming (within windowDays), later, past.
// If fewer than 2 projects fall within 7 days, expands to 14 days.
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
```

- [ ] **Step 2: Write a test for the splitIntoTiers helper**

Create `src/screens/Dashboard.test.jsx`:

```jsx
import { splitIntoTiers } from './Dashboard'

const future7 = { toDate: () => new Date(Date.now() + 3 * 86_400_000) }   // 3 days
const future10 = { toDate: () => new Date(Date.now() + 10 * 86_400_000) }  // 10 days
const future20 = { toDate: () => new Date(Date.now() + 20 * 86_400_000) }  // 20 days
const past = { toDate: () => new Date(Date.now() - 86_400_000) }           // yesterday

const p = (id, dueDate) => ({ id, courseId: 'c1', title: `proj ${id}`, dueDate })

it('places project due in 3 days in hot tier', () => {
  const { hot } = splitIntoTiers([p('1', future7)], { '1': null })
  expect(hot).toHaveLength(1)
})

it('places overdue project in past tier', () => {
  const { past: pastTier } = splitIntoTiers([p('1', past)], { '1': null })
  expect(pastTier).toHaveLength(1)
})

it('places project due in 20 days in later tier', () => {
  const { later } = splitIntoTiers([p('1', future20)], { '1': null })
  expect(later).toHaveLength(1)
})

it('expands hot to 14 days when fewer than 2 items in 7-day window', () => {
  // Only 1 item in 7 days, 1 item in 10 days → both should be hot
  const projects = [p('1', future7), p('2', future10)]
  const { hot } = splitIntoTiers(projects, { '1': null, '2': null })
  expect(hot).toHaveLength(2)
})

it('uses nextMilestone date for tier placement when project has milestones', () => {
  const project = p('1', null)
  const nextMs = { title: 'שלב א׳', index: 1, dueDate: future7 }
  const { hot } = splitIntoTiers([project], { '1': nextMs })
  expect(hot).toHaveLength(1)
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/screens/Dashboard.test.jsx
```

Expected: 5 passed.

- [ ] **Step 4: Commit**

```bash
git add src/screens/Dashboard.jsx src/screens/Dashboard.test.jsx
git commit -m "feat: rewrite Dashboard with tier logic and ProjectRow"
```

---

## Task 8: ProjectDetail screen redesign

**Files:**
- Modify: `src/screens/ProjectDetail.jsx`

Apply design system: PageHeader, CourseTag, UrgencyPill, sharp milestone rows, delete use of old MilestoneItem.

- [ ] **Step 1: Rewrite ProjectDetail**

Replace the full contents of `src/screens/ProjectDetail.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, deleteDoc, addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useProject } from '../hooks/useProject'
import { useCourses } from '../hooks/useCourses'
import { FileUpload } from '../components/FileUpload'
import { formatDateHe, formatRelativeDateHe, isOverdue, nextDatesForDay, dayIndexToHe } from '../utils/dates'
import { Pencil, Trash2, ChevronRight, Maximize2, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PageHeader } from '../components/PageHeader'
import { CourseTag } from '../components/CourseTag'
import { UrgencyPill } from '../components/UrgencyPill'

function pillVariant(dueDate) {
  if (!dueDate) return 'muted'
  const date = dueDate.toDate()
  if (date < new Date()) return 'danger'
  return (date - new Date()) / 86_400_000 <= 7 ? 'dark' : 'muted'
}

function formatIndex(n) {
  return String(n).padStart(2, '0')
}

export default function ProjectDetail({ onError }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { project, milestones, attachments, loading, error } = useProject(projectId)
  const { courses } = useCourses()
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    if (error) onError?.('שגיאה בטעינת הפרויקט')
  }, [error, onError])

  const course = courses.find(c => c.id === project?.courseId)
  const quickDates = course ? nextDatesForDay(course.day) : []

  const sortedMilestones = [...milestones].sort(
    (a, b) => a.dueDate.toDate() - b.dueDate.toDate()
  )

  async function handleDelete() {
    if (!confirm('למחוק את הפרויקט?')) return
    try {
      await deleteDoc(doc(db, 'projects', projectId))
      navigate(-1)
    } catch {
      onError?.('שגיאה במחיקת הפרויקט')
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault()
    if (!milestoneTitle || !milestoneDue) return
    try {
      await addDoc(collection(db, 'projects', projectId, 'milestones'), {
        title: milestoneTitle,
        dueDate: Timestamp.fromDate(new Date(milestoneDue)),
        projectId,
        courseId: project.courseId,
        projectTitle: project.title,
      })
      setMilestoneTitle('')
      setMilestoneDue('')
      setAddingMilestone(false)
    } catch {
      onError?.('שגיאה בהוספת הגשה')
    }
  }

  if (loading) return <div className="state-loading">טוען...</div>
  if (!project) return <div className="state-loading">פרויקט לא נמצא</div>

  return (
    <div className="text-right">
      <PageHeader
        title={project.title}
        action={
          <div className="flex gap-3 items-center">
            <Link to={`/projects/${projectId}/edit`} className="text-muted-foreground">
              <Pencil size={18} />
            </Link>
            <button onClick={handleDelete} className="text-destructive">
              <Trash2 size={18} />
            </button>
          </div>
        }
      />

      <div className="page-body">
        {/* Breadcrumb + meta */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground flex items-center gap-0.5 text-sm">
            <ChevronRight size={16} />
            {course?.name}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {course && (
            <CourseTag
              name={course.name}
              color={course.color}
              to={`/courses/${course.id}`}
            />
          )}
          {project.dueDate && (
            <UrgencyPill
              label={formatRelativeDateHe(project.dueDate)}
              variant={pillVariant(project.dueDate)}
            />
          )}
        </div>

        {project.description && (
          <p className="text-base text-foreground">{project.description}</p>
        )}

        {/* Attachments */}
        {attachments?.map(b => (
          <div key={b.id}>
            {['png', 'jpg', 'jpeg'].includes(b.fileType) ? (
              <img
                src={b.fileUrl}
                alt={b.fileName}
                className="max-w-full border border-border cursor-zoom-in"
                onClick={() => setLightbox({ url: b.fileUrl, type: 'image' })}
              />
            ) : b.fileType === 'pdf' ? (
              <div className="relative">
                <iframe
                  src={b.fileUrl}
                  title={b.fileName}
                  className="w-full border border-border"
                  style={{ height: '500px' }}
                />
                <button
                  onClick={() => setLightbox({ url: b.fileUrl, type: 'pdf' })}
                  className="absolute top-2 left-2 bg-background/80 p-1 text-muted-foreground"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            ) : (
              <a href={b.fileUrl} target="_blank" rel="noreferrer" className="action-link block py-1">
                {b.fileName}
              </a>
            )}
          </div>
        ))}

        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 left-4 text-white bg-black/40 p-1.5 z-10"
            >
              <X size={20} />
            </button>
            {lightbox.type === 'image' ? (
              <img
                src={lightbox.url}
                alt=""
                className="max-w-full max-h-full object-contain"
                style={{ touchAction: 'pinch-zoom' }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <iframe
                src={lightbox.url}
                className="w-full h-full"
                onClick={e => e.stopPropagation()}
              />
            )}
          </div>
        )}

        {/* Milestones */}
        <section className="flex flex-col">
          {sortedMilestones.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: '1px solid rgba(26,23,20,0.09)' }}
            >
              <span className="text-base font-medium">
                {formatIndex(i + 1)} {m.title}
              </span>
              <UrgencyPill
                label={formatRelativeDateHe(m.dueDate)}
                variant={pillVariant(m.dueDate)}
              />
            </div>
          ))}

          {!addingMilestone && (
            <button
              onClick={() => setAddingMilestone(true)}
              className="action-link text-sm mt-3 self-start"
            >
              + הוספת שלב
            </button>
          )}

          {addingMilestone && (
            <form onSubmit={handleAddMilestone} className="flex flex-col gap-2 mt-3">
              <Input
                type="text"
                value={milestoneTitle}
                onChange={e => setMilestoneTitle(e.target.value)}
                placeholder="שם השלב"
                required
              />
              {quickDates.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-muted-foreground">
                    בחר תאריך ({dayIndexToHe(course.day)})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickDates.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setMilestoneDue(d)}
                        className={`text-sm px-2.5 py-1 border transition-colors ${
                          milestoneDue === d
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(new Date(d + 'T00:00:00'))}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <input
                  type="date"
                  value={milestoneDue}
                  onChange={e => setMilestoneDue(e.target.value)}
                  required
                  className="field-input"
                  dir="ltr"
                />
              )}
              <Button type="submit" size="sm">הוסף</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setAddingMilestone(false)}>ביטול</Button>
            </form>
          )}
        </section>

        <FileUpload projectId={projectId} onError={onError} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing is broken**

```bash
npx vitest run
```

Expected: all pre-existing tests pass (ProjectDetail has no pre-existing tests, so no new failures expected).

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProjectDetail.jsx
git commit -m "feat: apply design system to ProjectDetail screen"
```

---

## Task 9: Schedule and CoursesList screens

**Files:**
- Modify: `src/screens/Schedule.jsx`
- Modify: `src/screens/CoursesList.jsx`
- Modify: `src/components/CourseCard.jsx`

- [ ] **Step 1: Update Schedule.jsx**

Replace full contents of `src/screens/Schedule.jsx`:

```jsx
import { useCourses } from '../hooks/useCourses'
import { PageHeader } from '../components/PageHeader'
import { SectionTier } from '../components/SectionTier'
import { EmptyState } from '../components/EmptyState'

const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']

export default function Schedule() {
  const { courses, loading } = useCourses()

  if (loading) return <div className="state-loading">טוען...</div>

  const byDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = courses.filter(c => c.day === day)
    return acc
  }, {})

  const hasAny = DAY_ORDER.some(day => byDay[day].length > 0)

  return (
    <div className="text-right">
      <PageHeader title="מערכת שעות" />
      {!hasAny && <EmptyState message="אין קורסים" />}
      {DAY_ORDER.map(day => {
        const dayCourses = byDay[day]
        if (!dayCourses.length) return null
        return (
          <div key={day}>
            <SectionTier label={day} variant="normal" />
            {dayCourses.map(course => (
              <div key={course.id} className="list-row items-start">
                <div className="color-dot mt-0.5" style={{ backgroundColor: course.color }} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-medium text-foreground">{course.name}</span>
                  <span className="text-sm text-muted-foreground">{course.hours} · {course.location}</span>
                  <span className="text-sm text-muted-foreground">{course.lecturer}</span>
                  {course.notes && (
                    <span className="text-sm text-muted-foreground">{course.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Update CoursesList.jsx**

Replace full contents of `src/screens/CoursesList.jsx`:

```jsx
import { useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { CourseCard } from '../components/CourseCard'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'

export default function CoursesList({ onError }) {
  const { courses, loading, error } = useCourses()

  useEffect(() => {
    if (error) onError?.('שגיאה בטעינת הקורסים')
  }, [error, onError])

  async function handleSave(course) {
    try {
      await updateDoc(doc(db, 'courses', course.id), {
        courseUrl: course.courseUrl,
        notes: course.notes,
      })
    } catch {
      onError?.('שגיאה בשמירת הקורס')
    }
  }

  if (loading) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right">
      <PageHeader title="קורסים" />
      {courses.length === 0
        ? <EmptyState message="אין קורסים" />
        : courses.map(course => (
            <CourseCard key={course.id} course={course} onSave={handleSave} />
          ))
      }
    </div>
  )
}
```

- [ ] **Step 3: Update CourseCard.jsx to use design system classes**

Replace `className="list-row-stacked"` wrapper and internal hardcoded color classes. Replace full contents of `src/components/CourseCard.jsx`:

```jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { dayIndexToHe } from '../utils/dates'
import { Input } from './ui/input'
import { Button } from './ui/button'

export function CourseCard({ course, onSave }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(course.courseUrl ?? '')
  const [notes, setNotes] = useState(course.notes ?? '')

  function handleSave() {
    onSave({ ...course, courseUrl: url, notes })
    setEditing(false)
  }

  return (
    <div className="list-row-stacked">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="color-dot" style={{ backgroundColor: course.color }} />
          <Link to={`/courses/${course.id}`} className="font-semibold text-foreground">
            {course.name}
          </Link>
        </div>
        <button
          aria-label="עריכה"
          onClick={() => setEditing(e => !e)}
          className="text-sm text-muted-foreground"
        >
          עריכה
        </button>
      </div>

      <div className="text-base text-muted-foreground">
        {dayIndexToHe(course.day)} · {course.hours} · {course.lecturer} · {course.location}
      </div>

      {course.courseUrl && !editing && (
        <a
          href={course.courseUrl}
          target="_blank"
          rel="noreferrer"
          className="action-link text-sm"
          aria-label="קישור לקורס"
        >
          קישור
        </a>
      )}

      {notes && !editing && (
        <div className="text-sm text-muted-foreground">{notes}</div>
      )}

      {editing && (
        <div className="flex flex-col gap-2 mt-1">
          <Input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="קישור לדרייב / מירו"
            dir="ltr"
          />
          <Input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="הערות (אופציונלי)"
          />
          <Button size="sm" onClick={handleSave} aria-label="שמור">
            שמור
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Schedule.jsx src/screens/CoursesList.jsx src/components/CourseCard.jsx
git commit -m "feat: apply design system to Schedule, CoursesList, CourseCard"
```

---

## Task 10: ProjectForm screen

**Files:**
- Modify: `src/screens/ProjectForm.jsx`

Apply sharp design tokens to WeekPicker and milestone rows.

- [ ] **Step 1: Update WeekPicker and form styling in ProjectForm.jsx**

In `src/screens/ProjectForm.jsx`, make these targeted changes:

1. Add imports at top:
```jsx
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
```

2. Replace the `<header>` block (lines ~216-220):
```jsx
<PageHeader
  title={isEdit ? 'עריכת פרויקט' : 'פרויקט חדש'}
  action={
    <Link to={isEdit ? `/projects/${projectId}` : '/'} className="text-base text-muted-foreground">
      ביטול
    </Link>
  }
/>
```

3. In `WeekPicker`, replace the button className string (the `isSelected` ternary) with:
```jsx
className={`
  flex flex-col items-center gap-0.5 py-2 border text-center transition-all
  ${isSelected
    ? 'bg-primary text-primary-foreground border-primary'
    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-card'
  }
`}
```

4. In the milestones section, replace the milestone container div className:
```jsx
// was: "flex flex-col gap-3 border border-border rounded-md p-3"
// replace with:
className="flex flex-col gap-3 border-t border-border pt-3"
```

5. Replace the single-deadline container div className:
```jsx
// was: "flex flex-col gap-2 border border-border rounded-md p-3"
// replace with:
className="flex flex-col gap-2 border-t border-border pt-3"
```

6. Replace the brief/attachment container div className:
```jsx
// was: "flex flex-col gap-2 border border-border rounded-md p-3"
// replace with:
className="flex flex-col gap-2 border-t border-border pt-3"
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProjectForm.jsx
git commit -m "feat: apply design system to ProjectForm screen"
```

---

## Task 11: Delete MilestoneItem

**Files:**
- Delete: `src/components/MilestoneItem.jsx`
- Delete: `src/components/MilestoneItem.test.jsx`

- [ ] **Step 1: Confirm MilestoneItem is no longer imported anywhere**

```bash
grep -r "MilestoneItem" /Users/gilli/dev/Bezalel/Cohub/src
```

Expected: no results (Dashboard and ProjectDetail no longer use it).

- [ ] **Step 2: Delete the files**

```bash
rm /Users/gilli/dev/Bezalel/Cohub/src/components/MilestoneItem.jsx
rm /Users/gilli/dev/Bezalel/Cohub/src/components/MilestoneItem.test.jsx
```

- [ ] **Step 3: Run full test suite to confirm nothing broke**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete MilestoneItem (replaced by ProjectRow)"
```

---

## Task 12: CourseDetail screen

**Files:**
- Modify: `src/screens/CourseDetail.jsx`

Apply PageHeader, remove hardcoded border classes.

- [ ] **Step 1: Update CourseDetail.jsx**

Add imports at top:
```jsx
import { PageHeader } from '../components/PageHeader'
```

Replace the `<header>` block (the entire `<header className="page-header bg-muted">...</header>`):
```jsx
<PageHeader
  title={course?.name}
  action={
    <Link to={`/projects/new?courseId=${courseId}`} className="action-link text-sm">
      + פרויקט חדש
    </Link>
  }
/>
```

Add a back link below PageHeader (inside the return, before the form section):
```jsx
<div className="px-4 pt-3">
  <Link to="/" className="text-muted-foreground flex items-center gap-0.5 text-sm">
    <ChevronRight size={16} />
    חזרה
  </Link>
</div>
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/screens/CourseDetail.jsx
git commit -m "feat: apply design system to CourseDetail screen"
```

---

## Task 13: Final verification

- [ ] **Step 1: Run the full test suite one last time**

```bash
npx vitest run
```

Expected: all tests pass, zero failures.

- [ ] **Step 2: Start the dev server and manually check each screen**

```bash
npm run dev
```

Visit each route and verify:
- `/` — Dashboard: tier sections, ProjectRow with inline milestone, past section collapsed
- `/projects/new` — ProjectForm: sharp corners, no box containers
- `/projects/:id` — ProjectDetail: PageHeader, milestone rows with index + pill
- `/projects/:id/edit` — ProjectForm edit mode
- `/courses` — CoursesList: PageHeader, course cards
- `/courses/:id` — CourseDetail: PageHeader, back link, Timeline unchanged
- `/schedule` — Schedule: SectionTier day headers, course rows

- [ ] **Step 3: Commit any fixes found during manual review**

```bash
git add -A
git commit -m "fix: post-review visual corrections"
```
