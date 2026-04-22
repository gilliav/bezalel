# Status Pill Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the icon-only `ProgressIndicator` button with a labeled pill that opens a 3-option dropdown for explicit status selection, with a visually distinct logged-out state.

**Architecture:** The `ProgressIndicator` component is reworked to render a `.pill`-styled Radix `Select` trigger showing an icon + Hebrew label. `useProgress` gains a new `setProgress(itemId, itemType, status)` function alongside the existing `cycleProgress`. `DashboardItem` and `Dashboard` are updated to wire the new `onProgressSelect` prop while keeping `onProgressCycle` available.

**Tech Stack:** React, Radix UI Select (already installed), Lucide icons, Tailwind + CSS `.pill` classes

---

## File Map

| File | Change |
|------|--------|
| `src/components/ProgressIndicator.jsx` | Rewrite — labeled pill + Radix Select dropdown; logged-out pill variant |
| `src/hooks/useProgress.js` | Add `setProgress(itemId, itemType, status)` alongside existing `cycleProgress` |
| `src/components/DashboardItem.jsx` | Add `onProgressSelect` prop; pass to `ProgressIndicator` |
| `src/screens/Dashboard.jsx` | Wire `onProgressSelect` down to each `DashboardItem` |

---

### Task 1: Add `setProgress` to `useProgress`

**Files:**
- Modify: `src/hooks/useProgress.js`

- [ ] **Step 1: Read the current file**

Open `src/hooks/useProgress.js` and confirm the current exports: `progressDocId`, `nextStatus`, `useProgress` (which returns `{ progressMap, cycleProgress }`).

- [ ] **Step 2: Add `setProgress` to the hook**

Inside `useProgress`, after the `cycleProgress` definition, add:

```js
const setProgress = useCallback(async (itemId, itemType, status) => {
  if (!uid) return
  const ref = doc(db, 'progress', progressDocId(uid, itemId))
  if (status === 'not_started') {
    await deleteDoc(ref)
  } else {
    await setDoc(ref, { uid, itemId, itemType, status, updatedAt: serverTimestamp() })
  }
}, [uid])
```

Return it alongside `cycleProgress`:

```js
return { progressMap, cycleProgress, setProgress }
```

- [ ] **Step 3: Verify the app still loads**

Run `npm run dev` and open the dashboard. Confirm no console errors. The UI should look identical at this point.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useProgress.js
git commit -m "feat: add setProgress to useProgress for explicit status selection"
```

---

### Task 2: Rewrite `ProgressIndicator` as a labeled pill with dropdown

**Files:**
- Modify: `src/components/ProgressIndicator.jsx`

- [ ] **Step 1: Replace the file contents**

The component now has two modes:
- **Logged-out:** a non-interactive `.pill pill-muted` showing a `LogIn` icon + "התחבר למעקב". Clicking calls `onSignInPrompt`.
- **Logged-in:** a Radix `Select` whose trigger is a `.pill` styled by status. The dropdown lists all three statuses with their icons and Hebrew labels. Selecting an item calls `onSelect(newStatus)`.

Replace the full file with:

```jsx
import { Circle, Clock, CheckCircle, LogIn } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const CONFIG = {
  not_started: {
    icon: Circle,
    label: 'לא התחלתי',
    pillClass: 'pill pill-muted',
    style: {},
  },
  in_progress: {
    icon: Clock,
    label: 'בתהליך',
    pillClass: 'pill',
    style: {
      backgroundColor: 'rgb(251 191 36 / 0.15)',
      color: 'rgb(217 119 6)',
      borderColor: 'rgb(217 119 6 / 0.4)',
    },
  },
  done: {
    icon: CheckCircle,
    label: 'סיימתי',
    pillClass: 'pill',
    style: {
      backgroundColor: 'rgb(22 163 74 / 0.12)',
      color: 'rgb(22 163 74)',
      borderColor: 'rgb(22 163 74 / 0.4)',
    },
  },
}

const STATUSES = ['not_started', 'in_progress', 'done']

// Props:
// - status: 'not_started' | 'in_progress' | 'done' (default: 'not_started')
// - onSelect: (newStatus) => void — when user is signed in
// - onSignInPrompt: () => void — when user is signed out
export function ProgressIndicator({ status = 'not_started', onSelect, onSignInPrompt }) {
  const isLoggedOut = !onSelect
  const { icon: Icon, label, pillClass, style } = CONFIG[status] ?? CONFIG['not_started']

  if (isLoggedOut) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          onSignInPrompt?.()
        }}
        className="pill pill-muted"
        title="התחבר כדי לעקוב אחרי ההתקדמות שלך"
        aria-label="התחבר כדי לעקוב אחרי ההתקדמות שלך"
      >
        <LogIn size={12} className="ms-0.5 me-1" />
        התחבר למעקב
      </button>
    )
  }

  return (
    <Select
      value={status}
      onValueChange={(val) => onSelect(val)}
      dir="rtl"
    >
      <SelectTrigger
        className={`${pillClass} border-0 h-auto p-0 focus:ring-0 focus:ring-offset-0 w-auto gap-1`}
        style={style}
        onClick={(e) => e.preventDefault()}
        asChild={false}
      >
        <Icon size={12} className="shrink-0" />
        <span>{label}</span>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => {
          const { icon: SIcon, label: sLabel } = CONFIG[s]
          return (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-2">
                <SIcon size={13} />
                {sLabel}
              </span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 2: Verify no import errors**

Run `npm run dev`. There should be no console errors. The ProgressIndicator may look broken in the dashboard because `DashboardItem` still passes `onCycle` — that's expected and will be fixed in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/components/ProgressIndicator.jsx
git commit -m "feat: rewrite ProgressIndicator as labeled pill with status dropdown"
```

---

### Task 3: Update `DashboardItem` to pass `onProgressSelect`

**Files:**
- Modify: `src/components/DashboardItem.jsx`

- [ ] **Step 1: Add `onProgressSelect` prop and wire it**

Replace the `ProgressIndicator` usage so it receives `onSelect` instead of `onCycle`:

```jsx
export function DashboardItem({ item, course, progressStatus = 'not_started', onProgressCycle, onProgressSelect, onSignInPrompt }) {
  const overdue = isOverdue(item.dueDate)
  const isMilestone = Boolean(item.projectTitle)

  return (
    <div
      className={`flex flex-row justify-between gap-1 border-primary list-row-stacked ${overdue ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-col gap-0">
        <Link to={`/projects/${item.projectId}`} className="col-span-2">
          <div className="flex items-center gap-1 overflow-hidden min-w-0">
            {isMilestone ? (
              <>
                <p className="font-display font-bold text-base text-foreground whitespace-nowrap shrink-0">
                  {item.projectTitle}
                </p>
                <ChevronsLeftIcon className="size-3" />
                <p className="text-base text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.title}
                </p>
              </>
            ) : (
              <p className="font-display font-bold text-base text-foreground">
                {item.title}
              </p>
            )}
          </div>
        </Link>
        {course && <Tag className="text-base w-max px-1 leading-none" value={course.name} color={course.color} />}
      </div>
      <div className="flex items-center gap-2">
        <p className={`flex gap-1 justify-end items-center ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
          <DateTag dueDate={item.dueDate} includeRelative />
        </p>
        <ProgressIndicator
          status={progressStatus}
          onSelect={onProgressSelect}
          onSignInPrompt={onSignInPrompt}
        />
      </div>
    </div>
  )
}
```

Note: `onProgressCycle` is kept in the props signature for backward compatibility but is no longer passed to `ProgressIndicator`. It can be removed later once `Dashboard` is updated.

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardItem.jsx
git commit -m "feat: wire onProgressSelect prop through DashboardItem to ProgressIndicator"
```

---

### Task 4: Update `Dashboard` to provide `onProgressSelect`

**Files:**
- Modify: `src/screens/Dashboard.jsx`

- [ ] **Step 1: Destructure `setProgress` from `useProgress`**

Change line 17:

```jsx
const { progressMap, cycleProgress, setProgress } = useProgress(user?.uid ?? null)
```

- [ ] **Step 2: Add `onProgressSelect` to each `DashboardItem` in all three tiers**

For each of the three item-rendering `.map()` blocks (hot, later, past), add the `onProgressSelect` prop. The handler calls `setProgress` with the new status:

```jsx
onProgressSelect={user ? (newStatus) => setProgress(item.id, isMilestone ? 'milestone' : 'project', newStatus) : undefined}
```

The full updated render for the `hot` tier (repeat the same pattern for `later` and `past`):

```jsx
{hot.map(item => {
  const isMilestone = Boolean(item.projectTitle)
  const status = user ? (progressMap[item.id] ?? 'not_started') : 'not_started'
  return (
    <DashboardItem
      key={item.id}
      item={item}
      course={courseMap[item.courseId]}
      progressStatus={status}
      onProgressCycle={user ? () => cycleProgress(item.id, isMilestone ? 'milestone' : 'project') : undefined}
      onProgressSelect={user ? (newStatus) => setProgress(item.id, isMilestone ? 'milestone' : 'project', newStatus) : undefined}
      onSignInPrompt={user === null ? signIn : undefined}
    />
  )
})}
```

Apply the same addition to `later.map(...)` and `past.map(...)`.

- [ ] **Step 3: Verify in the browser**

Run `npm run dev`. Open the dashboard:
- Logged out: each row shows a muted pill "התחבר למעקב" with a login icon. Clicking it should trigger the sign-in flow.
- Logged in: each row shows a pill with the current status icon + Hebrew label. Clicking opens a dropdown with three options. Selecting one updates the pill immediately (optimistic via Firestore `onSnapshot`).
- Switching between `not_started` → `in_progress` → `done` and back should all work.
- The pill for `not_started` should be visually muted (outlined, low contrast) but clearly visible and labeled.
- The pill for `in_progress` should be amber.
- The pill for `done` should be green.
- The logged-out pill and the `not_started` pill look different (different icon, different label).

- [ ] **Step 4: Commit**

```bash
git add src/screens/Dashboard.jsx
git commit -m "feat: connect setProgress to DashboardItem status pill dropdown"
```

---

### Task 5: Polish — fix SelectTrigger styling

The Radix `SelectTrigger` has default styles (height, border, ring) that need to be suppressed so the `.pill` class fully controls the appearance.

**Files:**
- Modify: `src/components/ProgressIndicator.jsx`

- [ ] **Step 1: Inspect the trigger in the browser**

Open DevTools and inspect the pill trigger. Check for:
- Unwanted border from `SelectTrigger` base styles
- Height being forced to `h-10` (40px) from the default class
- Focus ring showing on click

- [ ] **Step 2: Override trigger base styles if needed**

In `ProgressIndicator.jsx`, the `SelectTrigger` already has `className` overrides. If the visual inspection shows issues, add to the `SelectTrigger` className:

```jsx
className="pill border-0 h-auto min-h-0 py-0.5 px-2 focus:ring-0 focus:ring-offset-0 w-auto gap-1 [&>span:last-child]:hidden"
```

The `[&>span:last-child]:hidden` hides the default `▾` chevron that `SelectTrigger` renders (the pill label is already a clear affordance).

- [ ] **Step 3: Verify pill appearance across all three states**

Check that all three pills (not_started, in_progress, done) match the design:
- `not_started`: outlined muted pill, no fill
- `in_progress`: amber fill, amber border
- `done`: green fill, green border

- [ ] **Step 4: Commit if changes were needed**

```bash
git add src/components/ProgressIndicator.jsx
git commit -m "fix: suppress SelectTrigger default styles on status pill"
```
