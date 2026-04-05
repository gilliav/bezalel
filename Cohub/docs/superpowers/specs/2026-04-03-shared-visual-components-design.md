# Shared Visual Components — Design Spec
_Date: 2026-04-03_

## Goal

Extract three repeating visual patterns into shared components to reduce duplication and create a single source of truth for course-related UI elements.

---

## Components

### 1. `CourseLink`
**File:** `src/components/CourseLink.jsx`

A color dot followed by a linked course name. The current pattern appears in two places with slightly different markup.

**Props:**
- `course` — `{ id, name, color }`

**Renders:**
```
[●] Course Name  ← dot + react-router Link to /courses/:id
```

**Replaces:**
- `CourseCard.jsx:20-24` — dot + `<Link>`
- `ProjectDetail.jsx:82-84` — bare `<Link>` (dot currently missing here; `CourseLink` will add it)

---

### 2. `CourseBadge`
**File:** `src/components/CourseBadge.jsx`

A rounded-full pill with the course's color as background and the course name as white text. Used as an inline label on milestone rows.

**Props:**
- `course` — `{ name, color }` (no `id` needed — badge is not a link)

**Renders:**
```
[ Course Name ]  ← pill with course.color background, white text
```

**Replaces:**
- `MilestoneItem.jsx:15-20` — inline `<span>` with `style={{ backgroundColor: course?.color }}`

---

### 3. `CourseMetaLine`
**File:** `src/components/CourseMetaLine.jsx`

A single line of muted course metadata: day · hours · lecturer · location. Uses `dayIndexToHe` to convert the day index to Hebrew.

**Props:**
- `course` — `{ day, hours, lecturer, location }`

**Renders:**
```
ראשון · 10:00-12:00 · ד"ר כהן · חדר 101
```

**Replaces:**
- `CourseCard.jsx:35-37` — inline meta line

The Schedule screen's stacked layout (name + hours/location + lecturer on separate lines) is intentionally different and stays as-is.

---

## File locations

All three go in `src/components/` alongside existing components. No new subfolder.

```
src/components/
  CourseLink.jsx       ← new
  CourseBadge.jsx      ← new
  CourseMetaLine.jsx   ← new
  CourseCard.jsx       ← updated to use CourseLink + CourseMetaLine
  MilestoneItem.jsx    ← updated to use CourseBadge
  ...
src/screens/
  ProjectDetail.jsx    ← updated to use CourseLink
```

---

## Phase B (future)

`QuickDatePicker` — extract duplicated date-picker logic from `ProjectForm.jsx` and `ProjectDetail.jsx` into a shared component. Tracked separately.
