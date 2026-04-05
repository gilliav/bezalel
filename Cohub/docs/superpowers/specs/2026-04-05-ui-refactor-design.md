# UI Refactor & Design System — Cohub

**Date:** 2026-04-05  
**Status:** Approved

---

## Overview

Refactor all screens to use a consistent, minimalist design language with small, focused components. The primary goal is that a student can glance at the Dashboard and instantly understand what's due, what's urgent, and what's coming — without cognitive overhead.

---

## Visual Language

### Colors & Background
- App background: `#f7f3ec` (slightly cooler parchment than current `#f5eee2`)
- Row/card surface: same as background — no card boxes on the dashboard
- Keep existing CSS custom properties in `index.css`, update `--background` value
- Course accent colors (pink, lavender, peach, green, yellow, coral, blue) remain unchanged

### Typography
- Display/headers: `Almoni ML v5 AAA` (already in tailwind config as `font-display`)
- Body: `Almoni Tzar ML v5 AAA` (already in tailwind config as `font-body`)
- No font changes needed

### Borders & Radius
- `--radius: 0px` — sharp corners everywhere
- Pills: `border-radius: 2px` max
- Tags: underline-only (no background fill, `border-bottom: 1.5px solid <course-color>`)
- Page header bottom: `border-bottom: 2px solid #1a1714`
- Row separators: `border-bottom: 1px solid rgba(26,23,20,0.09)`
- No box shadows anywhere

### Urgency Pills
Three variants, all sharp-cornered (`border-radius: 2px`):
- **Dark** (`pill-dark`): `background: #1a1714; color: #f7f3ec; border: 1.5px solid #1a1714` — used for imminent deadlines (≤7 days)
- **Muted** (`pill-muted`): `background: transparent; color: rgba(26,23,20,0.4); border: 1.5px solid rgba(26,23,20,0.18)` — used for distant deadlines
- **Danger** (`pill-danger`): `background: #c0392b; color: #fff; border: 1.5px solid #c0392b` — used for overdue items

---

## Components to Create

### `UrgencyPill`
Props: `label: string`, `variant: 'dark' | 'muted' | 'danger'`  
Renders a date/countdown string in the appropriate pill style.  
Used everywhere a deadline appears.

### `CourseTag`
Props: `name: string`, `color: string`, `to?: string`  
Renders course name as underline-only tag in course color. If `to` is provided, wraps in a Link.  
Replaces the existing `Tag` component (which can be deleted or kept as alias).

### `SectionTier`
Props: `label: string`, `variant: 'hot' | 'normal'`  
Renders section label + extending hairline: `השבוע ————————`  
Hot variant: label in `#b83220`. Normal: `rgba(26,23,20,0.32)`.

### `ProjectRow`
Props: `project`, `course`, `nextMilestone?: { title: string, index: number } | null`  
The core dashboard row. Two layouts:
- **With milestone**: `[4px accent] | ProjectName › 01 MilestoneName [pill]` + course tag line below
- **No milestone** (single deadline): `[4px accent] | ProjectName [pill]` + course tag line below

The 4px right-edge accent stripe uses `course.color`.

### `PageHeader`
Props: `title: string`, `action?: ReactNode`  
Renders `<h1>` + optional right-side action slot. `border-bottom: 2px solid #1a1714`.

### `EmptyState`
Props: `message: string`  
Centered muted text for empty lists.

---

## Dashboard Screen Redesign

### Tier Logic
Items = all projects with a dueDate + all milestones. Sorted ascending by date.

- **השבוע**: items due within 7 days. If fewer than 2 items qualify, expand window to 14 days.
- **בהמשך**: all remaining upcoming items.
- **פרויקטים ישנים**: overdue items. Collapsed by default — user taps to expand.

### Grouping
Items are grouped by **project**. Each project renders as one `ProjectRow`.

**Tier placement**: A project is placed in the tier determined by its next upcoming deadline:
- For milestone-based projects: use the dueDate of the next upcoming (non-overdue) milestone
- For single-deadline projects: use the project dueDate
- If all deadlines are overdue (or no upcoming milestone exists), the project goes to the past section

**Row content**:

- If the project has milestones, find the next upcoming (not overdue) milestone and display it inline as `01 MilestoneName`
- Milestone index is its 1-based position among all milestones sorted by dueDate (formatted as `01`, `02`, etc.)
- The pill label uses `formatRelativeDateHe()` on the next milestone's dueDate
- If the project has no milestones, the pill uses `formatRelativeDateHe()` on the project dueDate

Projects without any dueDate and without any milestones are not shown on the Dashboard.

### Past Projects Section
- Collapsed by default with a toggle: `פרויקטים ישנים (3) ▾`
- When expanded, shows same `ProjectRow` format with `pill-danger` variant

---

## ProjectDetail Screen

Same sharp visual language:
- Page header with back chevron + course name as breadcrumb
- Project title as `<h1>`
- Description as body text (no wrapper box)
- Attachments inline (no changes to attachment logic)
- Milestones as a list of rows: `01 MilestoneName · date` — overdue ones in `pill-danger`
- Add milestone form: same inline expand behavior as today

---

## CourseDetail Screen

- Course info section: `InfoRow` component (already exists, keep it)
- Edit mode: unchanged
- Timeline below: unchanged (Timeline component not in scope for this refactor)

---

## ProjectForm Screen

- Same fields, same logic
- `WeekPicker` component: sharp corners, selected state uses `background: #1a1714; color: #f7f3ec`
- Multi-milestone section: each milestone row is visually flat (no card box), separated by hairlines

---

## Schedule Screen

- Day headers: same `SectionTier` component (label + hairline)
- Course rows: `list-row` pattern with color dot, unchanged layout

---

## CoursesList Screen

- Align to design system (currently uses raw `border-gray-200` classnames — replace with CSS vars)

---

## Component File Structure

New files to create:
```
src/components/UrgencyPill.jsx
src/components/CourseTag.jsx       (replaces/wraps existing ui/tag.jsx)
src/components/SectionTier.jsx
src/components/ProjectRow.jsx
src/components/PageHeader.jsx
src/components/EmptyState.jsx
```

Existing files to update:
- `src/index.css` — update `--background`, `--radius`, add `pill-*` and `tier-row` utility classes
- `src/screens/Dashboard.jsx` — full rewrite using new components
- `src/screens/ProjectDetail.jsx` — apply design system
- `src/screens/ProjectForm.jsx` — apply design system
- `src/screens/Schedule.jsx` — use `SectionTier`
- `src/screens/CoursesList.jsx` — align to design system
- `src/components/MilestoneItem.jsx` — delete; Dashboard uses `ProjectRow`, ProjectDetail gets its own inline milestone rows

---

## Out of Scope

- Timeline component (`Timeline.jsx`, `TimelineProject.jsx`, `TimelineMilestone.jsx`) — not touched
- Firebase logic, hooks, data model — no changes
- BottomNav — no changes
- Toast, ConnectionBanner — no changes
