# Course Catalog & Ratings — Design

## Purpose

Bezalel's Visual Communication students choose theory electives from a large
shared pool (60+ courses across the department's shnaton: general
requirements, proseminars, seminars, electives, interdisciplinary courses).
There's currently no way to see what a course or its lecturer is actually
like before picking it. This feature adds a RateMyProfessor/Glassdoor-style
rating system: a fast swipe-to-rate flow and a browse/search view with
aggregate stats.

This is a new, self-contained section of Cohub — not a modification of the
existing cohort-scoped `courses` collection, which models cohort A1's fixed
practical/studio schedule and is unrelated data.

## Non-goals (explicitly out of scope for this MVP)

- Attaching ratings to real student identity (Google account) — anonymous
  for now; upgrading an anonymous uid to a real account later via
  `linkWithCredential` preserves rating history, so this is a pure addition
  later, not a migration.
- Per-lecturer aggregate rollups across their multiple courses — the
  `lecturer` field is already on each course, so this is a future query/view,
  not a schema change.
- Admin CRUD UI for the catalog — the catalog is seeded once from the
  current shnaton via a script; corrections happen by re-running the seed
  script, matching the existing `seedCourses.js` pattern.
- Comment moderation/reporting.
- Cloud Functions / precomputed counters for aggregates — the course pool
  and rating volume are small enough for client-side aggregation over a live
  Firestore query.

## Data model

### `catalogCourses`

One doc per catalog entry. **Doc ID = the course code as printed in the
shnaton** (e.g. `2600811`, `9400271-2` for split tracks under one code).

| Field | Type | Notes |
|---|---|---|
| `courseCode` | string | Same as doc ID, duplicated for query convenience |
| `name` | string | |
| `description` | string | Free text from the shnaton |
| `lecturer` | string | |
| `category` | string | One of: `חובה כללית`, `פרוסמינר`, `סמינר סמסטריאלי`, `סמינר שנתי`, `בחירה עיוני`, `מקבץ בינתחומי` (matches codebase convention of storing display-ready Hebrew, see `day` field in existing `courses` collection) |
| `semester` | string | One of: `א`, `ב`, `שנתי`, `קיץ` |
| `day` | string | Hebrew day name, optional (some courses list a fixed day; some don't) |
| `hours` | string | e.g. `"16:00-14:30"`, optional |
| `credits` | map | `{ weeklyHours: number, points: number }` — from ש"ס/ש"ש and נ"ז |
| `language` | string | Default `עברית`; else `ערבית` / `אנגלית` |
| `targetYears` | string | e.g. `"ב-ג"`, `"ג-ה"`, optional |
| `location` | string | Only when notable, e.g. `"במוזיאון ישראל"`, optional |
| `notes` | string | Free text, e.g. capacity limits, prerequisites, optional |

Ratings reference `courseCode` only — they never embed schedule or lecturer
data. Re-seeding a future year's shnaton overwrites these fields on the same
doc ID without touching accumulated ratings.

### `catalogRatings`

**Doc ID = `${uid}_${courseCode}`** — resubmitting a rating overwrites the
existing doc rather than creating a duplicate. This is the dedup mechanism;
no separate uniqueness check is needed.

| Field | Type | Notes |
|---|---|---|
| `courseCode` | string | |
| `uid` | string | Firebase Auth uid (anonymous or real, whichever is active) |
| `status` | string | `rated` or `notTaken` |
| `recommend` | boolean | Required when `status: rated` |
| `profGood` | number (1-5) | Optional |
| `difficulty` | number (1-5) | Optional |
| `interesting` | number (1-5) | Optional |
| `workload` | number (1-5) | Optional |
| `attendanceTaken` | boolean | Optional |
| `comment` | string | Optional |
| `createdAt` | serverTimestamp | |

A "skip" in the swipe deck writes nothing — it's a session-only reorder, not
a persisted state. Only `rated` and `notTaken` are persisted, and both are
enough to drive "what's left to show this uid" everywhere (checklist and
deck) without a third state.

### Firestore rules additions

```
match /catalogCourses/{courseId} {
  allow read: if isAuthenticated();
  allow write: if false; // seeded via Admin SDK only
}

match /catalogRatings/{ratingId} {
  allow read: if isAuthenticated();
  allow create, update: if isAuthenticated()
    && request.resource.data.uid == request.auth.uid
    && ratingId == request.auth.uid + '_' + request.resource.data.courseCode;
  allow delete: if false;
}
```

## Auth

Anonymous Firebase auth, guarded:

```js
if (!auth.currentUser) await signInAnonymously(auth)
```

This only fires if nobody is signed in. If a cohort student already has a
Google-authenticated session open (from the main Cohub app in the same tab),
their existing uid is used for ratings instead — no forced anonymity, no
conflict with `AuthContext`. This section does not call `ensureUserDoc` or
touch the cohort-seeding logic at all.

## Routes & pages

Mounted as a separate top-level route branch in `App.jsx` (not nested inside
the cohort layout — no shared `BottomNav`, own minimal header):

- **`/catalog`** — browse/search. List of courses with name, lecturer,
  category badge, semester/day, and aggregate stats (e.g. "★4.2 · 87%
  recommend · 23 ratings"). Search by name; filter by category/semester.
- **`/catalog/:courseId`** — detail view: full course info + per-dimension
  aggregate stats (prof quality, difficulty, interesting, workload,
  attendance-taken %) + list of written comments. "Rate this course" button
  enters the swipe deck starting at this course.
- **`/catalog/rate`** — the rating flow (see below).

## Rating flow (`/catalog/rate`)

**Step 1 — taken-courses checklist.** A searchable, checkable list of all
courses in `catalogCourses` **excluding** any course that already has a
`catalogRatings` doc (`rated` or `notTaken`) for the current uid. Student
checks the courses they've taken, taps "Done."

This solves the "60+ courses, student took ~5-10" problem: swiping through
the whole catalog would make "didn't take this" the dominant, tedious
action. Checking a box for what you *did* take is faster and front-loads the
filtering, so the deck only contains courses worth a real opinion.

Persistence for "remembered next visit" comes for free from the existing
`rated`/`notTaken` tracking — no separate checklist-state collection needed.
If a student checks a box but abandons the deck before rating that course,
nothing was written yet, so it just reappears in the checklist next visit
(a one-tap redo, not a data-loss concern).

**Step 2 — swipe deck.** Queue = the checked courses. One card per course,
showing full course info plus inline rating controls:
- `recommend` — required toggle (thumbs / yes-no)
- `profGood`, `difficulty`, `interesting`, `workload` — optional 1-5 scales
- `attendanceTaken` — optional yes/no
- `comment` — optional textarea

Three actions, always available as real buttons (a drag/fling gesture is an
optional mobile enhancement layered on top, not a requirement — this keeps
the flow fully usable with mouse/keyboard on desktop too):
- **Submit & next** — writes `status: rated` (blocked until `recommend` is
  set)
- **Skip** — moves the card to the end of the in-memory queue for this
  session only; nothing is persisted
- **לא למדתי את הקורס** — writes `status: notTaken`, permanently excluded
  from future checklists/decks for this uid

## Component structure

- `screens/Catalog/CatalogList.jsx` — browse/search screen
- `screens/Catalog/CatalogDetail.jsx` — course detail + aggregate + comments
- `screens/Catalog/CatalogRate.jsx` — orchestrates checklist step → deck step
- `components/Catalog/CourseChecklist.jsx` — searchable multi-select list
- `components/Catalog/SwipeCard.jsx` — single card, rating controls, three
  actions
- `hooks/useCatalogCourses.js` — live query over `catalogCourses`
- `hooks/useCatalogRatings.js` — live query over `catalogRatings` for a
  given `courseCode`, or for a given `uid` (to drive checklist/deck
  filtering); exposes aggregate calculation (averages, counts, recommend %)
- `hooks/useCatalogAuth.js` — the guarded anonymous sign-in

## Seeding

`src/seed/seedCatalog.js`, following the existing `seedCourses.js` pattern
(firebase-admin + `serviceAccountKey.json`, idempotent — skips if
`catalogCourses` is non-empty). Populated from the shnaton PDF content
already provided. New `package.json` script: `"seed:catalog"`.

## Error handling

Reuses the existing `Toast`/`onError` prop pattern used by other screens.
Firestore write failures (e.g. offline) surface via `onError`; the existing
`ConnectionBanner`/`useOnlineStatus` already covers the global
offline-state indicator.

## Testing

Follows the existing co-located `ComponentName.test.jsx` pattern
(Vitest + Testing Library):
- `useCatalogRatings.test.js` — aggregate calculation correctness, dedup
  overwrite behavior (same uid+courseCode → one doc)
- `SwipeCard.test.jsx` — Submit is disabled until `recommend` is set; Skip
  vs. notTaken write different (or no) Firestore state
- `CourseChecklist.test.jsx` — excludes courses already `rated`/`notTaken`
  for the current uid
