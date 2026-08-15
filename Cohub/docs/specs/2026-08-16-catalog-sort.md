# Spec: Catalog Sorting

## Problem Statement

`CatalogList.jsx` — the main course-browsing screen — only supports a plain-text search over course name/lecturer. Courses render in whatever order `useCatalogCourses` returns from Firestore (effectively seed order), with no way to bring the best- or most-reviewed courses to the top. Every rating signal a student would want to sort by (`recommendPercent`, `profGood`, review `count`) is already computed per course via `computeAggregate`/`groupRatingsByCourseCode` and displayed on each `CourseListItem` card — it just isn't sortable.

This is the first half of a larger filtering-and-sorting effort; filtering (by category, semester, day, etc.) is scoped separately and follows this spec.

## Goals

- Let students reorder the catalog grid by name or by rating signal, using data already computed on the page.
- Keep unrated courses from cluttering the top of rating-based sorts, where a null/`--` value is meaningless as a ranking signal.
- Reuse the existing `Select` component and design tokens — no new UI primitives.

## Non-Goals

- **Filtering** (category, semester, day, language, credits) — separate follow-up spec.
- **Ascending/descending toggle per option** — each sort option has one fixed, sensible direction. Nobody wants "least recommended first" as a use case worth a control.
- **Persisting sort choice** (URL param, localStorage) across sessions/navigation — resets to default on remount, matching current search-box behavior.
- **Server-side sorting** (Firestore `orderBy`) — the full course list is already fetched unfiltered/unsorted client-side (~small N, no pagination), so sorting stays a client-side `useMemo`.

## Requirements (P0)

**Sort control**
- Add a `Select` dropdown next to the existing search `Input` in `CatalogList.jsx`.
- Options, in menu order:
  1. **שם (א-ת)** — Name A→Z, `localeCompare` on `course.name` — *default on load*
  2. **מומלץ ביותר** — `recommendPercent` descending
  3. **דירוג מרצה** — `profGood` descending
  4. **הכי הרבה דירוגים** — `count` descending
- *Acceptance criteria:* Selecting an option re-sorts the currently-filtered (by search) grid immediately; the search box and sort dropdown compose (search filters first, sort orders the result).

**Null/unrated handling**
- For the three rating-based sorts, any course whose aggregate has `count === 0` (equivalently `recommendPercent === null` / `profGood === null`) sorts to the bottom, below every rated course, regardless of the metric being sorted.
- Among unrated courses themselves, relative order falls back to name A→Z (stable, predictable — not left as insertion order).
- *Acceptance criteria:* Switching to any rating-based sort never shows a `--` card above a card with a real value.

**Implementation shape**
- One `const [sortBy, setSortBy] = useState('name')` alongside the existing `search` state.
- A `sortedCourses = useMemo(...)` derived from `filteredCourses` + `ratingsByCourse`, computed after the existing aggregate lookup so no course's aggregate is computed twice.
- Sort option definitions (key, label, comparator) live as a small local array/object in `CatalogList.jsx` — no new file needed for four options.

## Testing

No existing test file covers `CatalogList.jsx` (checked — only `SwipeCard.jsx`, `CourseListItem.jsx`, and `CourseChecklist.jsx` have `.test.jsx` siblings). This change won't introduce a new test framework or harness on its own; verification is manual via the dev server:
- Default load is name-sorted.
- Each of the three rating sorts places unrated courses last.
- Search + sort compose correctly (search narrows, sort still applies to the narrowed set).
- Switching sort options while a search term is active doesn't reset the search.

## Open Questions

None outstanding — scope and defaults were confirmed directly with the user (default sort: name A→Z; unrated handling: always last).
