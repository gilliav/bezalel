# Course Catalog & Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a RateMyProfessor/Glassdoor-style rating feature for Bezalel's theory course pool: a browse/search catalog with aggregate stats, a course detail page, and a swipe-to-rate flow — as a self-contained `/catalog` section of Cohub.

**Architecture:** Firestore holds two new collections (`catalogCourses`, seeded once from the real shnaton data; `catalogRatings`, one doc per uid+course, dedup via doc-ID overwrite). Client-side hooks mirror the existing `useCourses`/`useProjects` live-query pattern. Aggregate stats (recommend %, per-dimension averages) are computed client-side from a live query — no Cloud Functions. The section mounts as new routes in the existing `App.jsx`, sharing Cohub's Tailwind/RTL styling and UI kit, but never rendering the cohort `BottomNav` and never touching `AuthContext`'s cohort-seeding logic.

**Tech Stack:** React 18, React Router 6, Firestore (`firebase` client SDK + `firebase-admin` for seeding), Vitest + Testing Library, Tailwind (existing `ui/` component kit: `Button`, `Badge`, `Input`, `Textarea`).

**Spec:** [Cohub/docs/superpowers/specs/2026-08-13-course-catalog-ratings-design.md](../specs/2026-08-13-course-catalog-ratings-design.md)

## Global Constraints

- RTL Hebrew UI throughout (`dir` inherited from `body { direction: rtl }` in `index.css`); all new UI text is Hebrew, matching the rest of Cohub.
- No new UI library — reuse `src/components/ui/*` (Button, Badge, Input, Textarea) and the existing CSS utility classes (`page-header`, `page-body`, `list-row`, `list-row-stacked`, `field`, `field-label`, `state-loading`, `state-empty`, `action-link`) from `index.css`. Do not invent new global CSS classes.
- Ratings collection doc ID is always `${uid}_${courseCode}` — this is the entire dedup mechanism; do not add a separate uniqueness check.
- The catalog section must never render `BottomNav` and must never call `ensureUserDoc` / touch `AuthContext`'s cohort-seeding logic (spec section "Auth").
- Anonymous auth only signs in if nobody is already signed in (spec section "Auth") — implemented via `onAuthStateChanged`, not a synchronous `auth.currentUser` check, since Firebase auth state is not guaranteed to be available synchronously on first render.
- File placement follows existing repo conventions: hooks flat under `src/hooks/`, utils flat under `src/utils/`, screens flat under `src/screens/` (no subfolder — matches `CoursesList.jsx`, `CourseDetail.jsx`, `Schedule.jsx`), and the three catalog-specific components grouped under `src/components/Catalog/` (matching the existing `src/components/Timeline/` precedent for a cohesive multi-file sub-feature).
- Test files are colocated as `X.test.jsx`/`X.test.js` next to the file they test, using Vitest + Testing Library, matching every existing test in the repo.

---

## Data prerequisite (already done)

`Cohub/src/seed/catalogCourseData.js` already exists in the repo with the full transcribed course catalog (63 courses, real course codes/names/lecturers/schedules/descriptions from the shnaton PDF). Task 3 below imports it — no further data entry is needed. Two known data-quality notes are documented as comments at the top of that file (one course omitted due to scrambled source PDF metadata; one course given a synthetic ID because the source printed no course code for it).

---

### Task 1: Firestore security rules

**Files:**
- Modify: `Cohub/firestore.rules`

**Interfaces:**
- Produces: `catalogCourses` collection readable by any authenticated user (including anonymous), writable only via the Admin SDK. `catalogRatings` collection readable by any authenticated user, writable only by the rating's own owner into their own doc ID.

- [ ] **Step 1: Add the two new rule blocks**

Open `Cohub/firestore.rules`. Insert the following two `match` blocks inside `service cloud.firestore { match /databases/{database}/documents { ... } }`, alongside the existing `courses`/`cohorts`/`projects`/`progress` blocks (position doesn't matter, but grouping them together after the existing `courses` block keeps it readable):

```
    // catalogCourses: any authenticated user (including anonymous) can read;
    // no client writes — seeded via Admin SDK only (src/seed/seedCatalog.js)
    match /catalogCourses/{courseId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    // catalogRatings: any authenticated user can read (needed for aggregate
    // stats); a user may only create/update their own rating doc, whose ID
    // must be `${uid}_${courseCode}` — this is the dedup mechanism
    match /catalogRatings/{ratingId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated()
        && request.resource.data.uid == request.auth.uid
        && ratingId == request.auth.uid + '_' + request.resource.data.courseCode;
      allow delete: if false;
    }
```

- [ ] **Step 2: Deploy the rules**

Run: `cd Cohub && firebase deploy --only firestore:rules`
Expected: deploy succeeds (the CLI is already authenticated to the `bezalel-hub` project, confirmed earlier in this session).

- [ ] **Step 3: Commit**

```bash
cd Cohub && git add firestore.rules
git commit -m "feat: add Firestore rules for catalogCourses and catalogRatings"
```

---

### Task 2: Aggregate calculation utility

**Files:**
- Create: `Cohub/src/utils/catalogAggregate.js`
- Test: `Cohub/src/utils/catalogAggregate.test.js`

**Interfaces:**
- Produces: `computeAggregate(ratings: RatingDoc[]) -> { count, recommendPercent, profGood, difficulty, interesting, workload, attendanceTakenPercent }` (all fields `null` when `count === 0`, or when no rating provided a value for that specific optional field). `groupRatingsByCourseCode(ratings: RatingDoc[]) -> { [courseCode]: RatingDoc[] }`.
- Consumes: nothing (pure functions, no Firebase dependency — this is why it's split out from the hooks, for fast unit testing).

- [ ] **Step 1: Write the failing tests**

Create `Cohub/src/utils/catalogAggregate.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { computeAggregate, groupRatingsByCourseCode } from './catalogAggregate'

describe('computeAggregate', () => {
  it('returns all-null aggregate when there are no ratings', () => {
    expect(computeAggregate([])).toEqual({
      count: 0,
      recommendPercent: null,
      profGood: null,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTakenPercent: null,
    })
  })

  it('ignores notTaken docs when computing count and averages', () => {
    const ratings = [
      { status: 'notTaken' },
      { status: 'rated', recommend: true, profGood: 5 },
    ]
    expect(computeAggregate(ratings).count).toBe(1)
  })

  it('computes recommend percent rounded to nearest integer', () => {
    const ratings = [
      { status: 'rated', recommend: true },
      { status: 'rated', recommend: true },
      { status: 'rated', recommend: false },
    ]
    expect(computeAggregate(ratings).recommendPercent).toBe(67)
  })

  it('averages numeric scale fields, ignoring ratings that omitted them', () => {
    const ratings = [
      { status: 'rated', recommend: true, profGood: 4 },
      { status: 'rated', recommend: true, profGood: 2 },
      { status: 'rated', recommend: true, profGood: null },
    ]
    expect(computeAggregate(ratings).profGood).toBe(3)
  })

  it('computes attendanceTakenPercent only from ratings that answered it', () => {
    const ratings = [
      { status: 'rated', recommend: true, attendanceTaken: true },
      { status: 'rated', recommend: true, attendanceTaken: false },
      { status: 'rated', recommend: true, attendanceTaken: null },
    ]
    expect(computeAggregate(ratings).attendanceTakenPercent).toBe(50)
  })
})

describe('groupRatingsByCourseCode', () => {
  it('groups ratings by their courseCode', () => {
    const ratings = [
      { courseCode: 'A', id: '1' },
      { courseCode: 'B', id: '2' },
      { courseCode: 'A', id: '3' },
    ]
    expect(groupRatingsByCourseCode(ratings)).toEqual({
      A: [{ courseCode: 'A', id: '1' }, { courseCode: 'A', id: '3' }],
      B: [{ courseCode: 'B', id: '2' }],
    })
  })

  it('returns an empty object for an empty list', () => {
    expect(groupRatingsByCourseCode([])).toEqual({})
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd Cohub && npx vitest run src/utils/catalogAggregate.test.js`
Expected: FAIL — `catalogAggregate.js` does not exist yet.

- [ ] **Step 3: Implement**

Create `Cohub/src/utils/catalogAggregate.js`:

```js
export function computeAggregate(ratings) {
  const rated = ratings.filter(r => r.status === 'rated')
  const count = rated.length

  if (count === 0) {
    return {
      count: 0,
      recommendPercent: null,
      profGood: null,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTakenPercent: null,
    }
  }

  const avg = (key) => {
    const values = rated.map(r => r[key]).filter(v => typeof v === 'number')
    if (values.length === 0) return null
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  const recommendCount = rated.filter(r => r.recommend === true).length
  const attendanceEntries = rated.filter(r => typeof r.attendanceTaken === 'boolean')
  const attendanceTrueCount = attendanceEntries.filter(r => r.attendanceTaken === true).length

  return {
    count,
    recommendPercent: Math.round((recommendCount / count) * 100),
    profGood: avg('profGood'),
    difficulty: avg('difficulty'),
    interesting: avg('interesting'),
    workload: avg('workload'),
    attendanceTakenPercent: attendanceEntries.length > 0
      ? Math.round((attendanceTrueCount / attendanceEntries.length) * 100)
      : null,
  }
}

export function groupRatingsByCourseCode(ratings) {
  const map = {}
  for (const rating of ratings) {
    if (!map[rating.courseCode]) map[rating.courseCode] = []
    map[rating.courseCode].push(rating)
  }
  return map
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd Cohub && npx vitest run src/utils/catalogAggregate.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/utils/catalogAggregate.js src/utils/catalogAggregate.test.js
git commit -m "feat: add catalog rating aggregate calculation utility"
```

---

### Task 3: Seed script

**Files:**
- Create: `Cohub/src/seed/seedCatalog.js`
- Modify: `Cohub/package.json`

**Interfaces:**
- Consumes: `CATALOG_COURSES` array from `./catalogCourseData.js` (already in the repo — see "Data prerequisite" above). Each course object has `courseCode`, `name`, `lecturer`, `category`, `description`, `credits: { weeklyHours, points }`, `language`, and optionally `semester`, `day`, `hours`, `location`, `notes`, `targetYears`.
- Produces: populates the `catalogCourses` Firestore collection. Idempotent — exits without writing if the collection is already non-empty (same pattern as `seedCourses.js`).

This task has no automated test — `seedCourses.js`, the existing analogous script, has none either (it's a one-off Admin SDK script, not app code covered by the Vitest/jsdom setup). Verification is manual, via steps 2-3 below.

- [ ] **Step 1: Write the seed script**

Create `Cohub/src/seed/seedCatalog.js`:

```js
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { CATALOG_COURSES } from './catalogCourseData.js'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seed() {
  const existing = await db.collection('catalogCourses').get()
  if (!existing.empty) {
    console.log('Catalog already seeded. Exiting.')
    process.exit(0)
  }

  // Some course codes are genuinely reused across different courses in the
  // source shnaton (see the data-quality notes at the top of
  // catalogCourseData.js) — disambiguate any repeat into its own doc ID.
  const seen = new Map()
  for (const course of CATALOG_COURSES) {
    const occurrence = (seen.get(course.courseCode) ?? 0) + 1
    seen.set(course.courseCode, occurrence)
    const docId = occurrence === 1 ? course.courseCode : `${course.courseCode}-dup${occurrence}`
    await db.collection('catalogCourses').doc(docId).set(course)
    console.log(`Seeded: ${docId} — ${course.name}`)
  }
  console.log(`Done. Seeded ${CATALOG_COURSES.length} courses.`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Add the npm script**

In `Cohub/package.json`, add a `seed:catalog` entry to `scripts`, next to the existing `seed` / `seed:cohort` entries:

```json
    "seed": "node src/seed/seedCourses.js",
    "seed:catalog": "node src/seed/seedCatalog.js",
    "migrate:attachments": "node src/seed/migrateBriefsToAttachments.js",
```

- [ ] **Step 3: Run it against the real project and verify**

Run: `cd Cohub && npm run seed:catalog`
Expected: console logs one "Seeded: ..." line per course, ending with "Done. Seeded 63 courses." Verify in the Firebase console (Firestore → `catalogCourses`) that the collection now has 63 docs, and that the two colliding raw codes each produced a `-dup2` doc (search for docs named `9400264-dup2`, `9400271-dup2`, `1700813-dup2`).

Run it a second time to confirm idempotency: `npm run seed:catalog` again.
Expected: only "Catalog already seeded. Exiting." — no duplicate writes.

- [ ] **Step 4: Commit**

```bash
cd Cohub && git add src/seed/seedCatalog.js package.json src/seed/catalogCourseData.js
git commit -m "feat: add catalog seed script and real course data"
```

---

### Task 4: Anonymous auth hook

**Files:**
- Create: `Cohub/src/hooks/useCatalogAuth.js`
- Test: `Cohub/src/hooks/useCatalogAuth.test.js`

**Interfaces:**
- Produces: `useCatalogAuth() -> { uid: string | null, ready: boolean }`. `ready` is `true` once a uid (anonymous or otherwise) is known.
- Consumes: `auth` from `../firebase`.

- [ ] **Step 1: Write the failing test**

Create `Cohub/src/hooks/useCatalogAuth.test.js`:

```js
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ auth: {} }))

const mockOnAuthStateChanged = vi.hoisted(() => vi.fn())
const mockSignInAnonymously = vi.hoisted(() => vi.fn())
const mockUnsubscribe = vi.hoisted(() => vi.fn())

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signInAnonymously: mockSignInAnonymously,
}))

import { useCatalogAuth } from './useCatalogAuth'

describe('useCatalogAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('signs in anonymously when nobody is signed in', async () => {
    mockSignInAnonymously.mockResolvedValue({})
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return mockUnsubscribe
    })

    renderHook(() => useCatalogAuth())

    await waitFor(() => expect(mockSignInAnonymously).toHaveBeenCalled())
  })

  it('does not sign in again when a user is already active', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: 'existing-uid' })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogAuth())

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.uid).toBe('existing-uid')
    expect(mockSignInAnonymously).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd Cohub && npx vitest run src/hooks/useCatalogAuth.test.js`
Expected: FAIL — `useCatalogAuth.js` does not exist yet.

- [ ] **Step 3: Implement**

Create `Cohub/src/hooks/useCatalogAuth.js`:

```js
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase'

export function useCatalogAuth() {
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        signInAnonymously(auth).catch(() => {})
      }
    })
    return unsub
  }, [])

  return { uid, ready: uid !== null }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd Cohub && npx vitest run src/hooks/useCatalogAuth.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/hooks/useCatalogAuth.js src/hooks/useCatalogAuth.test.js
git commit -m "feat: add guarded anonymous auth hook for catalog section"
```

---

### Task 5: Catalog courses hook

**Files:**
- Create: `Cohub/src/hooks/useCatalogCourses.js`
- Test: `Cohub/src/hooks/useCatalogCourses.test.js`

**Interfaces:**
- Produces: `useCatalogCourses() -> { courses: CourseDoc[], loading: boolean, error: Error | null }`, where each `CourseDoc` is `{ id, courseCode, name, lecturer, category, description, credits, language, semester?, day?, hours?, location?, notes?, targetYears? }`.

- [ ] **Step 1: Write the failing test**

Create `Cohub/src/hooks/useCatalogCourses.test.js` (mirrors the existing `useCourses.test.js` pattern exactly):

```js
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockOnSnapshot = vi.hoisted(() => vi.fn())

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useCatalogCourses } from './useCatalogCourses'

describe('useCatalogCourses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns courses from the catalogCourses Firestore snapshot', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: '1700686', data: () => ({ name: 'תולדות האיור', lecturer: 'אורנה גרנות' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.courses).toEqual([
      { id: '1700686', name: 'תולדות האיור', lecturer: 'אורנה גרנות' },
    ])
  })

  it('sets error state on snapshot failure', async () => {
    mockOnSnapshot.mockImplementation((q, onNext, onError) => {
      onError(new Error('permission denied'))
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd Cohub && npx vitest run src/hooks/useCatalogCourses.test.js`
Expected: FAIL — `useCatalogCourses.js` does not exist yet.

- [ ] **Step 3: Implement**

Create `Cohub/src/hooks/useCatalogCourses.js`:

```js
import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useCatalogCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'catalogCourses'),
      (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [])

  return { courses, loading, error }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd Cohub && npx vitest run src/hooks/useCatalogCourses.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/hooks/useCatalogCourses.js src/hooks/useCatalogCourses.test.js
git commit -m "feat: add useCatalogCourses hook"
```

---

### Task 6: Catalog ratings hooks and write functions

**Files:**
- Create: `Cohub/src/hooks/useCatalogRatings.js`
- Test: `Cohub/src/hooks/useCatalogRatings.test.js`

**Interfaces:**
- Produces:
  - `useAllCatalogRatings() -> { ratings, loading, error }` — every doc in `catalogRatings`, unfiltered (used by `CatalogList` to compute per-course aggregates in one listener instead of one-per-row).
  - `useCourseRatings(courseCode) -> { ratings, loading, error }` — filtered to one course (used by `CatalogDetail`).
  - `useUserRatingStatus(uid) -> { ratedCodes: Set<string>, notTakenCodes: Set<string>, loading, error }` — filtered to one uid (used by `CourseChecklist`/`CatalogRate` to exclude already-handled courses).
  - `submitRating({ uid, courseCode, recommend, profGood, difficulty, interesting, workload, attendanceTaken, comment }) -> Promise<void>` — writes/overwrites `catalogRatings/${uid}_${courseCode}` with `status: 'rated'`.
  - `markNotTaken({ uid, courseCode }) -> Promise<void>` — writes/overwrites the same doc with `status: 'notTaken'`.
- Consumes: `db` from `../firebase`.

- [ ] **Step 1: Write the failing tests**

Create `Cohub/src/hooks/useCatalogRatings.test.js`:

```js
import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockOnSnapshot = vi.hoisted(() => vi.fn())
const mockQuery = vi.hoisted(() => vi.fn((...args) => ({ __query: args })))
const mockWhere = vi.hoisted(() => vi.fn((...args) => ({ __where: args })))
const mockSetDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDoc = vi.hoisted(() => vi.fn((...args) => ({ __doc: args })))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  query: mockQuery,
  where: mockWhere,
  onSnapshot: mockOnSnapshot,
  doc: mockDoc,
  setDoc: mockSetDoc,
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}))

import {
  useAllCatalogRatings,
  useCourseRatings,
  useUserRatingStatus,
  submitRating,
  markNotTaken,
} from './useCatalogRatings'

describe('useAllCatalogRatings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns every rating doc unfiltered', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({ docs: [{ id: 'u1_c1', data: () => ({ courseCode: 'c1', uid: 'u1', status: 'rated' }) }] })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useAllCatalogRatings())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.ratings).toEqual([
      { id: 'u1_c1', courseCode: 'c1', uid: 'u1', status: 'rated' },
    ])
  })
})

describe('useCourseRatings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries filtered by courseCode', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({ docs: [] })
      return mockUnsubscribe
    })

    renderHook(() => useCourseRatings('c1'))

    await waitFor(() => expect(mockWhere).toHaveBeenCalledWith('courseCode', '==', 'c1'))
  })
})

describe('useUserRatingStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('splits ratings into ratedCodes and notTakenCodes sets', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: 'd1', data: () => ({ courseCode: 'c1', status: 'rated' }) },
          { id: 'd2', data: () => ({ courseCode: 'c2', status: 'notTaken' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useUserRatingStatus('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.ratedCodes).toEqual(new Set(['c1']))
    expect(result.current.notTakenCodes).toEqual(new Set(['c2']))
  })
})

describe('submitRating', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes a rated doc at the uid_courseCode doc id', async () => {
    await submitRating({
      uid: 'u1',
      courseCode: 'c1',
      recommend: true,
      profGood: 4,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTaken: null,
      comment: '',
    })

    expect(mockDoc).toHaveBeenCalledWith({}, 'catalogRatings', 'u1_c1')
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'rated', recommend: true, profGood: 4, courseCode: 'c1', uid: 'u1' }),
    )
  })
})

describe('markNotTaken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes a notTaken doc at the uid_courseCode doc id', async () => {
    await markNotTaken({ uid: 'u1', courseCode: 'c1' })

    expect(mockDoc).toHaveBeenCalledWith({}, 'catalogRatings', 'u1_c1')
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'notTaken', courseCode: 'c1', uid: 'u1' }),
    )
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd Cohub && npx vitest run src/hooks/useCatalogRatings.test.js`
Expected: FAIL — `useCatalogRatings.js` does not exist yet.

- [ ] **Step 3: Implement**

Create `Cohub/src/hooks/useCatalogRatings.js`:

```js
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function useAllCatalogRatings() {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'catalogRatings'),
      (snap) => {
        setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [])

  return { ratings, loading, error }
}

export function useCourseRatings(courseCode) {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseCode) return
    const q = query(collection(db, 'catalogRatings'), where('courseCode', '==', courseCode))
    return onSnapshot(
      q,
      (snap) => {
        setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [courseCode])

  return { ratings, loading, error }
}

export function useUserRatingStatus(uid) {
  const [ratedCodes, setRatedCodes] = useState(new Set())
  const [notTakenCodes, setNotTakenCodes] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'catalogRatings'), where('uid', '==', uid))
    return onSnapshot(
      q,
      (snap) => {
        const rated = new Set()
        const notTaken = new Set()
        snap.docs.forEach(d => {
          const data = d.data()
          if (data.status === 'rated') rated.add(data.courseCode)
          if (data.status === 'notTaken') notTaken.add(data.courseCode)
        })
        setRatedCodes(rated)
        setNotTakenCodes(notTaken)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [uid])

  return { ratedCodes, notTakenCodes, loading, error }
}

export async function submitRating({
  uid, courseCode, recommend, profGood, difficulty, interesting, workload, attendanceTaken, comment,
}) {
  await setDoc(doc(db, 'catalogRatings', `${uid}_${courseCode}`), {
    courseCode,
    uid,
    status: 'rated',
    recommend,
    profGood: profGood ?? null,
    difficulty: difficulty ?? null,
    interesting: interesting ?? null,
    workload: workload ?? null,
    attendanceTaken: attendanceTaken ?? null,
    comment: comment ?? '',
    createdAt: serverTimestamp(),
  })
}

export async function markNotTaken({ uid, courseCode }) {
  await setDoc(doc(db, 'catalogRatings', `${uid}_${courseCode}`), {
    courseCode,
    uid,
    status: 'notTaken',
    createdAt: serverTimestamp(),
  })
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd Cohub && npx vitest run src/hooks/useCatalogRatings.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/hooks/useCatalogRatings.js src/hooks/useCatalogRatings.test.js
git commit -m "feat: add catalog ratings hooks and write functions"
```

---

### Task 7: Catalog browse/search screen

**Files:**
- Create: `Cohub/src/components/Catalog/CourseListItem.jsx`
- Create: `Cohub/src/components/Catalog/CourseListItem.test.jsx`
- Create: `Cohub/src/screens/CatalogList.jsx`
- Create: `Cohub/src/screens/CatalogList.test.jsx`

**Interfaces:**
- Consumes: `useCatalogCourses()` from Task 5, `useAllCatalogRatings()` from Task 6, `computeAggregate`/`groupRatingsByCourseCode` from Task 2.
- Produces: `CourseListItem({ course, aggregate })` — a `<Link>` row. `CatalogList` — default-exported screen mounted at `/catalog`.

- [ ] **Step 1: Write the failing test for CourseListItem**

Create `Cohub/src/components/Catalog/CourseListItem.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { it, expect } from 'vitest'
import { CourseListItem } from './CourseListItem'

const course = { id: '1700686', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני' }

it('shows course name, lecturer, and category', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
  expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
  expect(screen.getByText('בחירה עיוני')).toBeInTheDocument()
})

it('shows "no ratings yet" when aggregate count is 0', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('אין דירוגים עדיין')).toBeInTheDocument()
})

it('shows recommend percent and rating count when ratings exist', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 12, recommendPercent: 83 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText(/83% ממליצים/)).toBeInTheDocument()
  expect(screen.getByText(/12 דירוגים/)).toBeInTheDocument()
})

it('links to the course detail page', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/catalog/1700686')
})
```

- [ ] **Step 2: Run and verify failure**

Run: `cd Cohub && npx vitest run src/components/Catalog/CourseListItem.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CourseListItem**

Create `Cohub/src/components/Catalog/CourseListItem.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge'

export function CourseListItem({ course, aggregate }) {
  const statsText = aggregate.count === 0
    ? 'אין דירוגים עדיין'
    : `${aggregate.recommendPercent}% ממליצים · ${aggregate.count} דירוגים`

  return (
    <Link to={`/catalog/${course.id}`} className="list-row-stacked block">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{course.name}</span>
        <Badge variant="muted">{course.category}</Badge>
      </div>
      <div className="text-base text-muted-foreground">{course.lecturer}</div>
      <div className="text-sm text-muted-foreground">{statsText}</div>
    </Link>
  )
}
```

- [ ] **Step 4: Run and verify pass**

Run: `cd Cohub && npx vitest run src/components/Catalog/CourseListItem.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the failing test for CatalogList**

Create `Cohub/src/screens/CatalogList.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseAllCatalogRatings = vi.hoisted(() => vi.fn())

vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({ useAllCatalogRatings: mockUseAllCatalogRatings }))

import CatalogList from './CatalogList'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני' },
  { id: 'c2', name: 'סכיזואנליזה', lecturer: 'אהד זהבי', category: 'סמינר סמסטריאלי' },
]

describe('CatalogList', () => {
  beforeEach(() => {
    mockUseCatalogCourses.mockReturnValue({ courses, loading: false })
    mockUseAllCatalogRatings.mockReturnValue({ ratings: [], loading: false })
  })

  it('renders all courses when there is no search term', () => {
    render(<MemoryRouter><CatalogList /></MemoryRouter>)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('סכיזואנליזה')).toBeInTheDocument()
  })

  it('filters courses by name as the user types', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><CatalogList /></MemoryRouter>)

    await user.type(screen.getByPlaceholderText('חיפוש לפי שם קורס או מרצה'), 'איור')

    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('סכיזואנליזה')).not.toBeInTheDocument()
  })

  it('shows a loading state while courses are loading', () => {
    mockUseCatalogCourses.mockReturnValue({ courses: [], loading: true })
    render(<MemoryRouter><CatalogList /></MemoryRouter>)
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run and verify failure**

Run: `cd Cohub && npx vitest run src/screens/CatalogList.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement CatalogList**

Create `Cohub/src/screens/CatalogList.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useAllCatalogRatings } from '../hooks/useCatalogRatings'
import { computeAggregate, groupRatingsByCourseCode } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Input } from '../components/ui/input'
import { CourseListItem } from '../components/Catalog/CourseListItem'

export default function CatalogList() {
  const { courses, loading: coursesLoading } = useCatalogCourses()
  const { ratings, loading: ratingsLoading } = useAllCatalogRatings()
  const [search, setSearch] = useState('')

  const ratingsByCourse = useMemo(() => groupRatingsByCourseCode(ratings), [ratings])

  const filteredCourses = useMemo(() => {
    const term = search.trim()
    if (!term) return courses
    return courses.filter(c => c.name.includes(term) || c.lecturer?.includes(term))
  }, [courses, search])

  if (coursesLoading || ratingsLoading) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right">
      <PageHeader title="קטלוג קורסים" />
      <div className="page-body pb-0">
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם קורס או מרצה"
        />
      </div>
      {filteredCourses.length === 0
        ? <EmptyState message="לא נמצאו קורסים" />
        : filteredCourses.map(course => (
            <CourseListItem
              key={course.id}
              course={course}
              aggregate={computeAggregate(ratingsByCourse[course.id] ?? [])}
            />
          ))
      }
    </div>
  )
}
```

- [ ] **Step 8: Run and verify pass**

Run: `cd Cohub && npx vitest run src/screens/CatalogList.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 9: Commit**

```bash
cd Cohub && git add src/components/Catalog/CourseListItem.jsx src/components/Catalog/CourseListItem.test.jsx src/screens/CatalogList.jsx src/screens/CatalogList.test.jsx
git commit -m "feat: add catalog browse/search screen"
```

---

### Task 8: Catalog detail screen

**Files:**
- Create: `Cohub/src/screens/CatalogDetail.jsx`
- Create: `Cohub/src/screens/CatalogDetail.test.jsx`

**Interfaces:**
- Consumes: `useCatalogCourses()` (Task 5), `useCourseRatings(courseCode)` (Task 6), `computeAggregate` (Task 2). Reads `:courseId` from the route via `useParams()`.
- Produces: default-exported screen mounted at `/catalog/:courseId`.

- [ ] **Step 1: Write the failing test**

Create `Cohub/src/screens/CatalogDetail.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseCourseRatings = vi.hoisted(() => vi.fn())

vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({ useCourseRatings: mockUseCourseRatings }))

import CatalogDetail from './CatalogDetail'

const course = {
  id: 'c1',
  name: 'תולדות האיור',
  lecturer: 'אורנה גרנות',
  category: 'בחירה עיוני',
  semester: 'א',
  day: 'ראשון',
  hours: '11:00-09:30',
  credits: { weeklyHours: 2, points: 2 },
  description: 'איורים הם יצירות האמנות הראשונות שאנו מכירים.',
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/catalog/c1']}>
      <Routes>
        <Route path="/catalog/:courseId" element={<CatalogDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogDetail', () => {
  beforeEach(() => {
    mockUseCatalogCourses.mockReturnValue({ courses: [course], loading: false })
    mockUseCourseRatings.mockReturnValue({ ratings: [], loading: false })
  })

  it('shows course name, lecturer, and description', () => {
    renderDetail()
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
    expect(screen.getByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).toBeInTheDocument()
  })

  it('shows "no ratings yet" when there are none', () => {
    renderDetail()
    expect(screen.getByText('אין דירוגים עדיין')).toBeInTheDocument()
  })

  it('shows aggregate stats and written comments when ratings exist', () => {
    mockUseCourseRatings.mockReturnValue({
      ratings: [
        { id: 'r1', status: 'rated', recommend: true, profGood: 5, comment: 'קורס מעולה' },
      ],
      loading: false,
    })
    renderDetail()
    expect(screen.getByText(/100% ממליצים/)).toBeInTheDocument()
    expect(screen.getByText('קורס מעולה')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `cd Cohub && npx vitest run src/screens/CatalogDetail.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `Cohub/src/screens/CatalogDetail.jsx`:

```jsx
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useCourseRatings } from '../hooks/useCatalogRatings'
import { computeAggregate } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'

export default function CatalogDetail() {
  const { courseId } = useParams()
  const { courses, loading: coursesLoading } = useCatalogCourses()
  const { ratings, loading: ratingsLoading } = useCourseRatings(courseId)

  const course = courses.find(c => c.id === courseId)

  if (coursesLoading || ratingsLoading || !course) return <div className="state-loading">טוען...</div>

  const aggregate = computeAggregate(ratings)
  const comments = ratings.filter(r => r.status === 'rated' && r.comment)

  return (
    <div className="text-right">
      <PageHeader title={course.name} />
      <div className="px-4 pt-3">
        <Link to="/catalog" className="text-muted-foreground flex items-center gap-0.5 text-sm">
          <ChevronRight size={16} />
          חזרה לקטלוג
        </Link>
      </div>

      <div className="page-body border-b border-border pb-4">
        <div className="flex flex-col gap-1 text-sm">
          <div>{course.lecturer}</div>
          <div className="text-muted-foreground">
            {course.category} · {course.semester === 'שנתי' ? 'שנתי' : `סמסטר ${course.semester}`}
          </div>
          {course.day && <div className="text-muted-foreground">{course.day} · {course.hours}</div>}
          <div className="text-muted-foreground">{course.credits.weeklyHours} ש"ס · {course.credits.points} נ"ז</div>
        </div>
        <p className="text-base">{course.description}</p>
      </div>

      <div className="page-body border-b border-border pb-4">
        <h2 className="mb-2">דירוגים</h2>
        {aggregate.count === 0 ? (
          <div className="text-muted-foreground text-sm">אין דירוגים עדיין</div>
        ) : (
          <div className="flex flex-col gap-1 text-sm">
            <div>{aggregate.recommendPercent}% ממליצים · {aggregate.count} דירוגים</div>
            {aggregate.profGood !== null && <div>איכות הוראה: {aggregate.profGood.toFixed(1)}/5</div>}
            {aggregate.difficulty !== null && <div>קושי: {aggregate.difficulty.toFixed(1)}/5</div>}
            {aggregate.interesting !== null && <div>מעניין: {aggregate.interesting.toFixed(1)}/5</div>}
            {aggregate.workload !== null && <div>עומס: {aggregate.workload.toFixed(1)}/5</div>}
            {aggregate.attendanceTakenPercent !== null && <div>נוכחות נבדקת: {aggregate.attendanceTakenPercent}%</div>}
          </div>
        )}
        <Link to={`/catalog/rate?start=${course.id}`}>
          <Button size="sm" className="mt-3">דרג/י את הקורס</Button>
        </Link>
      </div>

      {comments.length > 0 && (
        <div className="page-body">
          <h2 className="mb-2">תגובות</h2>
          <div className="flex flex-col gap-3">
            {comments.map(r => (
              <div key={r.id} className="text-sm text-foreground">{r.comment}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run and verify pass**

Run: `cd Cohub && npx vitest run src/screens/CatalogDetail.test.jsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/screens/CatalogDetail.jsx src/screens/CatalogDetail.test.jsx
git commit -m "feat: add catalog course detail screen"
```

---

### Task 9: SwipeCard component

**Files:**
- Create: `Cohub/src/components/Catalog/SwipeCard.jsx`
- Create: `Cohub/src/components/Catalog/SwipeCard.test.jsx`

**Interfaces:**
- Produces: `SwipeCard({ course, onSubmit, onSkip, onNotTaken })`. `onSubmit` is called with `{ recommend, profGood, difficulty, interesting, workload, attendanceTaken, comment }` — only when `recommend` has been set (submit button disabled otherwise).
- Consumes: `course.name`, `course.lecturer`, `course.category`, `course.description`.

- [ ] **Step 1: Write the failing test**

Create `Cohub/src/components/Catalog/SwipeCard.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { SwipeCard } from './SwipeCard'

const course = {
  id: 'c1',
  name: 'תולדות האיור',
  lecturer: 'אורנה גרנות',
  category: 'בחירה עיוני',
  description: 'איורים הם יצירות האמנות הראשונות שאנו מכירים.',
}

describe('SwipeCard', () => {
  it('shows the course name and description', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={vi.fn()} onNotTaken={vi.fn()} />)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).toBeInTheDocument()
  })

  it('disables submit until recommend is chosen', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={vi.fn()} onNotTaken={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'שליחה והמשך' })).toBeDisabled()
  })

  it('submits with the chosen recommend value and defaults for untouched optional fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SwipeCard course={course} onSubmit={onSubmit} onSkip={vi.fn()} onNotTaken={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'כן, ממליץ/ה' }))
    await user.click(screen.getByRole('button', { name: 'שליחה והמשך' }))

    expect(onSubmit).toHaveBeenCalledWith({
      recommend: true,
      profGood: null,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTaken: null,
      comment: '',
    })
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={onSkip} onNotTaken={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'דלג/י' }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('calls onNotTaken when "לא למדתי את הקורס" is clicked', async () => {
    const user = userEvent.setup()
    const onNotTaken = vi.fn()
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={vi.fn()} onNotTaken={onNotTaken} />)
    await user.click(screen.getByRole('button', { name: 'לא למדתי את הקורס' }))
    expect(onNotTaken).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `cd Cohub && npx vitest run src/components/Catalog/SwipeCard.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `Cohub/src/components/Catalog/SwipeCard.jsx`:

```jsx
import { useState } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

const SCALE = [1, 2, 3, 4, 5]

export function SwipeCard({ course, onSubmit, onSkip, onNotTaken }) {
  const [recommend, setRecommend] = useState(null)
  const [profGood, setProfGood] = useState(null)
  const [difficulty, setDifficulty] = useState(null)
  const [interesting, setInteresting] = useState(null)
  const [workload, setWorkload] = useState(null)
  const [attendanceTaken, setAttendanceTaken] = useState(null)
  const [comment, setComment] = useState('')

  function handleSubmit() {
    onSubmit({ recommend, profGood, difficulty, interesting, workload, attendanceTaken, comment })
  }

  return (
    <div className="page-body border border-border rounded-lg">
      <h2>{course.name}</h2>
      <div className="text-sm text-muted-foreground">{course.lecturer} · {course.category}</div>
      <p className="text-sm text-foreground">{course.description}</p>

      <div className="field">
        <label className="field-label">האם תמליץ/י על הקורס?</label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={recommend === true ? 'default' : 'outline'}
            onClick={() => setRecommend(true)}
          >
            כן, ממליץ/ה
          </Button>
          <Button
            type="button"
            size="sm"
            variant={recommend === false ? 'default' : 'outline'}
            onClick={() => setRecommend(false)}
          >
            לא ממליץ/ה
          </Button>
        </div>
      </div>

      <ScaleField label="איכות ההוראה" value={profGood} onChange={setProfGood} />
      <ScaleField label="רמת הקושי" value={difficulty} onChange={setDifficulty} />
      <ScaleField label="עד כמה מעניין" value={interesting} onChange={setInteresting} />
      <ScaleField label="עומס העבודה" value={workload} onChange={setWorkload} />

      <div className="field">
        <label className="field-label">האם נבדקת נוכחות?</label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={attendanceTaken === true ? 'default' : 'outline'}
            onClick={() => setAttendanceTaken(true)}
          >
            כן
          </Button>
          <Button
            type="button"
            size="sm"
            variant={attendanceTaken === false ? 'default' : 'outline'}
            onClick={() => setAttendanceTaken(false)}
          >
            לא
          </Button>
        </div>
      </div>

      <div className="field">
        <label className="field-label">תגובה (אופציונלי)</label>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2 mt-2">
        <Button onClick={handleSubmit} disabled={recommend === null}>
          שליחה והמשך
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSkip} className="flex-1">
            דלג/י
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onNotTaken} className="flex-1">
            לא למדתי את הקורס
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScaleField({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="flex gap-1">
        {SCALE.map(n => (
          <Button
            key={n}
            type="button"
            size="sm"
            variant={value === n ? 'default' : 'outline'}
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n}`}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run and verify pass**

Run: `cd Cohub && npx vitest run src/components/Catalog/SwipeCard.test.jsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/components/Catalog/SwipeCard.jsx src/components/Catalog/SwipeCard.test.jsx
git commit -m "feat: add SwipeCard rating component"
```

---

### Task 10: CourseChecklist component

**Files:**
- Create: `Cohub/src/components/Catalog/CourseChecklist.jsx`
- Create: `Cohub/src/components/Catalog/CourseChecklist.test.jsx`

**Interfaces:**
- Produces: `CourseChecklist({ courses, excludeIds, onDone })`. `onDone(selectedCourseIds: string[])` is called when the user finishes. Courses whose `id` is in `excludeIds` (a `Set`) are never shown.

- [ ] **Step 1: Write the failing test**

Create `Cohub/src/components/Catalog/CourseChecklist.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { CourseChecklist } from './CourseChecklist'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות' },
  { id: 'c2', name: 'סכיזואנליזה', lecturer: 'אהד זהבי' },
  { id: 'c3', name: 'זכויות יוצרים', lecturer: 'איל פרייס' },
]

describe('CourseChecklist', () => {
  it('excludes courses already handled for this uid', () => {
    render(<CourseChecklist courses={courses} excludeIds={new Set(['c2'])} onDone={vi.fn()} />)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('סכיזואנליזה')).not.toBeInTheDocument()
  })

  it('filters by search term across name and lecturer', async () => {
    const user = userEvent.setup()
    render(<CourseChecklist courses={courses} excludeIds={new Set()} onDone={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('חיפוש לפי שם קורס או מרצה'), 'זכויות')

    expect(screen.getByText('זכויות יוצרים')).toBeInTheDocument()
    expect(screen.queryByText('תולדות האיור')).not.toBeInTheDocument()
  })

  it('disables Done until at least one course is checked', () => {
    render(<CourseChecklist courses={courses} excludeIds={new Set()} onDone={vi.fn()} />)
    expect(screen.getByRole('button', { name: /סיימתי/ })).toBeDisabled()
  })

  it('calls onDone with the checked course ids', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<CourseChecklist courses={courses} excludeIds={new Set()} onDone={onDone} />)

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('checkbox', { name: /זכויות יוצרים/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    expect(onDone).toHaveBeenCalledWith(['c1', 'c3'])
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `cd Cohub && npx vitest run src/components/Catalog/CourseChecklist.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `Cohub/src/components/Catalog/CourseChecklist.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function CourseChecklist({ courses, excludeIds, onDone }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())

  const availableCourses = useMemo(
    () => courses.filter(c => !excludeIds.has(c.id)),
    [courses, excludeIds],
  )

  const filteredCourses = useMemo(() => {
    const term = search.trim()
    if (!term) return availableCourses
    return availableCourses.filter(c => c.name.includes(term) || c.lecturer?.includes(term))
  }, [availableCourses, search])

  function toggle(courseId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  return (
    <div className="text-right">
      <div className="page-body pb-2">
        <p className="text-base text-muted-foreground">
          סמנו את הקורסים שלמדתם, ואז דרגו אותם אחד אחד
        </p>
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם קורס או מרצה"
        />
      </div>
      <div>
        {filteredCourses.map(course => (
          <label key={course.id} className="list-row items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(course.id)}
              onChange={() => toggle(course.id)}
              aria-label={course.name}
              className="w-5 h-5"
            />
            <div className="flex flex-col">
              <span className="text-base text-foreground">{course.name}</span>
              <span className="text-sm text-muted-foreground">{course.lecturer}</span>
            </div>
          </label>
        ))}
      </div>
      <div className="page-body">
        <Button onClick={() => onDone(Array.from(selected))} disabled={selected.size === 0}>
          סיימתי, התחילו לדרג ({selected.size})
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run and verify pass**

Run: `cd Cohub && npx vitest run src/components/Catalog/CourseChecklist.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/components/Catalog/CourseChecklist.jsx src/components/Catalog/CourseChecklist.test.jsx
git commit -m "feat: add CourseChecklist component"
```

---

### Task 11: CatalogRate orchestration screen

**Files:**
- Create: `Cohub/src/screens/CatalogRate.jsx`
- Create: `Cohub/src/screens/CatalogRate.test.jsx`

**Interfaces:**
- Consumes: `useCatalogAuth()` (Task 4), `useCatalogCourses()` (Task 5), `useUserRatingStatus(uid)` / `submitRating` / `markNotTaken` (Task 6), `CourseChecklist` (Task 10), `SwipeCard` (Task 9).
- Produces: default-exported screen mounted at `/catalog/rate`. Reads an optional `?start=<courseId>` query param (set by `CatalogDetail`'s "דרג/י את הקורס" link) to skip straight into the deck for one course instead of the checklist.

- [ ] **Step 1: Write the failing test**

Create `Cohub/src/screens/CatalogRate.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogAuth = vi.hoisted(() => vi.fn())
const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseUserRatingStatus = vi.hoisted(() => vi.fn())
const mockSubmitRating = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMarkNotTaken = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('../hooks/useCatalogAuth', () => ({ useCatalogAuth: mockUseCatalogAuth }))
vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({
  useUserRatingStatus: mockUseUserRatingStatus,
  submitRating: mockSubmitRating,
  markNotTaken: mockMarkNotTaken,
}))

import CatalogRate from './CatalogRate'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני', description: 'תיאור' },
  { id: 'c2', name: 'זכויות יוצרים', lecturer: 'איל פרייס', category: 'בחירה עיוני', description: 'תיאור' },
]

describe('CatalogRate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCatalogAuth.mockReturnValue({ uid: 'u1', ready: true })
    mockUseCatalogCourses.mockReturnValue({ courses, loading: false })
    mockUseUserRatingStatus.mockReturnValue({
      ratedCodes: new Set(),
      notTakenCodes: new Set(),
      loading: false,
    })
  })

  it('shows the checklist first', () => {
    render(<MemoryRouter initialEntries={['/catalog/rate']}><CatalogRate /></MemoryRouter>)
    expect(screen.getByText('אילו קורסים למדת?')).toBeInTheDocument()
  })

  it('moves to the swipe deck for the checked courses after Done', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/catalog/rate']}><CatalogRate /></MemoryRouter>)

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('אילו קורסים למדת?')).not.toBeInTheDocument()
  })

  it('advances to the next card and calls submitRating after Submit', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/catalog/rate']}><CatalogRate /></MemoryRouter>)

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('checkbox', { name: /זכויות יוצרים/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    await user.click(screen.getByRole('button', { name: 'כן, ממליץ/ה' }))
    await user.click(screen.getByRole('button', { name: 'שליחה והמשך' }))

    expect(mockSubmitRating).toHaveBeenCalledWith(expect.objectContaining({ uid: 'u1', courseCode: 'c1', recommend: true }))
    expect(screen.getByText('זכויות יוצרים')).toBeInTheDocument()
  })

  it('shows a finished message once the deck (from ?start=) is empty', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/catalog/rate?start=c1']}><CatalogRate /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'כן, ממליץ/ה' }))
    await user.click(screen.getByRole('button', { name: 'שליחה והמשך' }))

    expect(screen.getByText(/סיימת לדרג/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `cd Cohub && npx vitest run src/screens/CatalogRate.test.jsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `Cohub/src/screens/CatalogRate.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useUserRatingStatus, submitRating, markNotTaken } from '../hooks/useCatalogRatings'
import { PageHeader } from '../components/PageHeader'
import { CourseChecklist } from '../components/Catalog/CourseChecklist'
import { SwipeCard } from '../components/Catalog/SwipeCard'

export default function CatalogRate({ onError }) {
  const [searchParams] = useSearchParams()
  const startCourseId = searchParams.get('start')
  const { uid, ready } = useCatalogAuth()
  const { courses, loading: coursesLoading } = useCatalogCourses()
  const { ratedCodes, notTakenCodes, loading: statusLoading } = useUserRatingStatus(uid)

  const [phase, setPhase] = useState(startCourseId ? 'deck' : 'checklist')
  const [queue, setQueue] = useState(startCourseId ? [startCourseId] : [])

  const excludeIds = useMemo(() => new Set([...ratedCodes, ...notTakenCodes]), [ratedCodes, notTakenCodes])

  function handleChecklistDone(selectedIds) {
    setQueue(selectedIds)
    setPhase('deck')
  }

  async function handleSubmit(fields) {
    const courseId = queue[0]
    try {
      await submitRating({ uid, courseCode: courseId, ...fields })
      setQueue(q => q.slice(1))
    } catch {
      onError?.('שגיאה בשמירת הדירוג')
    }
  }

  async function handleNotTaken() {
    const courseId = queue[0]
    try {
      await markNotTaken({ uid, courseCode: courseId })
      setQueue(q => q.slice(1))
    } catch {
      onError?.('שגיאה בשמירה')
    }
  }

  function handleSkip() {
    setQueue(q => (q.length <= 1 ? q : [...q.slice(1), q[0]]))
  }

  if (!ready || coursesLoading || statusLoading) return <div className="state-loading">טוען...</div>

  if (phase === 'checklist') {
    return (
      <div className="text-right">
        <PageHeader title="אילו קורסים למדת?" />
        <CourseChecklist courses={courses} excludeIds={excludeIds} onDone={handleChecklistDone} />
      </div>
    )
  }

  const currentCourse = courses.find(c => c.id === queue[0])

  if (!currentCourse) {
    return (
      <div className="text-right">
        <PageHeader title="דירוג קורסים" />
        <div className="state-empty">
          סיימת לדרג! <Link to="/catalog" className="action-link">חזרה לקטלוג</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="text-right">
      <PageHeader title="דירוג קורסים" />
      <SwipeCard
        key={currentCourse.id}
        course={currentCourse}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        onNotTaken={handleNotTaken}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run and verify pass**

Run: `cd Cohub && npx vitest run src/screens/CatalogRate.test.jsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd Cohub && git add src/screens/CatalogRate.jsx src/screens/CatalogRate.test.jsx
git commit -m "feat: add catalog rating flow orchestration screen"
```

---

### Task 12: Wire up routes and verify end-to-end

**Files:**
- Modify: `Cohub/src/App.jsx`

**Interfaces:**
- Consumes: `CatalogList` (Task 7), `CatalogDetail` (Task 8), `CatalogRate` (Task 11).
- Produces: `/catalog`, `/catalog/rate`, `/catalog/:courseId` routes, mounted without `BottomNav`.

No new automated test is added here — this task wires already-tested screens into routing, which the repo doesn't currently cover with a dedicated `App.test.jsx`. Verification is the manual dev-server smoke test in Step 3, plus running the full existing suite in Step 4 to confirm nothing broke.

- [ ] **Step 1: Restructure App.jsx to hide BottomNav on /catalog routes**

`useLocation()` must run inside `<BrowserRouter>` to know the current path, but `App.jsx` currently returns `<BrowserRouter>` as its outermost element with no component inside it that could call `useLocation()`. Introduce a small `AppShell` inner component to hold that logic.

Replace the full contents of `Cohub/src/App.jsx` with:

```jsx
import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Toast } from './components/Toast'
import { ConnectionBanner } from './components/ConnectionBanner'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import Dashboard from './screens/Dashboard'
import CoursesList from './screens/CoursesList'
import CourseDetail from './screens/CourseDetail'
import ProjectDetail from './screens/ProjectDetail'
import ProjectForm from './screens/ProjectForm'
import Schedule from './screens/Schedule'
import CatalogList from './screens/CatalogList'
import CatalogDetail from './screens/CatalogDetail'
import CatalogRate from './screens/CatalogRate'

function AppShell({ toastMessage, setToastMessage, isOnline }) {
  const location = useLocation()
  const isCatalogRoute = location.pathname.startsWith('/catalog')

  return (
    <>
      <ConnectionBanner isOnline={isOnline} />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <div className="min-h-screen pb-16 max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard onError={setToastMessage} />} />
          <Route path="/courses" element={<CoursesList onError={setToastMessage} />} />
          <Route path="/courses/:courseId" element={<CourseDetail onError={setToastMessage} />} />
          <Route path="/projects/new" element={<ProjectForm onError={setToastMessage} />} />
          <Route path="/projects/:projectId" element={<ProjectDetail onError={setToastMessage} />} />
          <Route path="/projects/:projectId/edit" element={<ProjectForm onError={setToastMessage} />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/catalog" element={<CatalogList />} />
          <Route path="/catalog/rate" element={<CatalogRate onError={setToastMessage} />} />
          <Route path="/catalog/:courseId" element={<CatalogDetail />} />
        </Routes>
      </div>
      {!isCatalogRoute && <BottomNav />}
    </>
  )
}

export default function App() {
  const [toastMessage, setToastMessage] = useState(null)
  const isOnline = useOnlineStatus()

  return (
    <BrowserRouter>
      <AppShell toastMessage={toastMessage} setToastMessage={setToastMessage} isOnline={isOnline} />
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Run the full test suite**

Run: `cd Cohub && npx vitest run`
Expected: PASS — every test file in the repo, old and new, passes. This confirms the `App.jsx` restructure didn't break existing routes/behavior.

- [ ] **Step 3: Manual dev-server smoke test**

Run: `cd Cohub && npm run dev`

In a browser:
1. Navigate to `/catalog` — the course list loads (63 courses, from the seed run in Task 3), search filters as you type, no bottom nav bar is visible.
2. Click a course — `/catalog/:id` shows its full description, credits, schedule, and "אין דירוגים עדיין".
3. Click "דרג/י את הקורס" — lands in the swipe deck for that one course. Fill in a rating (recommend required), submit — lands on "סיימת לדרג!".
4. Navigate back to that course's detail page — the aggregate now shows "100% ממליצים · 1 דירוגים" and any comment you left.
5. Navigate to `/catalog/rate` directly (no `?start=`) — the checklist appears first, and the course you just rated is not in the list (excluded via `ratedCodes`).
6. Navigate to `/` — the cohort Dashboard and `BottomNav` are back, unaffected.

- [ ] **Step 4: Commit**

```bash
cd Cohub && git add src/App.jsx
git commit -m "feat: wire catalog routes into App.jsx, hide BottomNav on /catalog"
```

---

## Plan self-review notes

- **Spec coverage:** data model (Tasks 1, 3, 6), auth (Task 4), routes & pages (Tasks 7, 8, 12), rating flow / checklist-then-deck (Tasks 9, 10, 11), aggregates (Task 2), seeding (Task 3), testing pattern (every task) — all spec sections have a corresponding task.
- **Type/name consistency check:** `courseCode` (not `code`) used consistently across `catalogCourseData.js`, `seedCatalog.js`, `useCatalogRatings.js`, `catalogAggregate.js`. Rating status values are exactly `'rated'` / `'notTaken'` everywhere (no `'skipped'` status — skip is intentionally never persisted, per spec). `uid`/`ready` from `useCatalogAuth` match what `CatalogRate` consumes. `ratedCodes`/`notTakenCodes` (plural, `Set`) match between `useCatalogRatings.js`'s `useUserRatingStatus` and `CatalogRate.jsx`'s usage.
- **Scope deviation from spec, called out explicitly:** the spec's component-structure section listed screens under `screens/Catalog/*`; this plan uses flat `screens/CatalogList.jsx` etc. to match the repo's actual existing convention (no screen currently lives in a subfolder). Catalog-specific components do use a `components/Catalog/` subfolder, matching the existing `components/Timeline/` precedent.
