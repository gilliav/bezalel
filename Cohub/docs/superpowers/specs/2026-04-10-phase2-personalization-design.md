# Phase 2: Personalization — Design Spec

## Goal

Allow individual students to optionally sign in and track their personal progress on assignments (marking milestones/projects as in progress or done). The app remains fully public — login is opt-in. Phase 2 assumes all users are A1 Visual Communication students.

---

## Architecture

The existing public app is unchanged. Login adds a personal layer on top:

- **Firebase Auth** (Google Sign-In) handles authentication
- **`users` Firestore collection** stores each student's profile, cohort, and course list
- **`progress` Firestore collection** stores per-student, per-item status
- **`cohorts` Firestore collection** stores cohort metadata and default course lists

No existing screens break. Everything is additive.

---

## Data Model

### `cohorts/{cohortId}`

Cohort IDs are stable and never renamed. Display name is separate.

```
cohorts/{cohortId}         // e.g. "cohort_viscom_2024_A1"
  displayName: string      // e.g. "א'1"
  department: string       // e.g. "visual_communication"
  year: number             // intake year, e.g. 2024
  courseIds: string[]      // default course list for this cohort
```

### `users/{uid}`

Seeded at first login. `courseIds` is pre-populated from the cohort's default list and can be customized per student in a future phase. `yearIndex` is hardcoded to 1 for all phase 2 users (all A1, first year).

```
users/{uid}
  email: string
  displayName: string
  cohortId: string         // e.g. "cohort_viscom_2024_A1"
  department: string       // e.g. "visual_communication"
  yearIndex: number        // 1 for all phase 2 users
  courseIds: string[]      // seeded from cohort, reserved for per-student customization in phase 3
  createdAt: timestamp
```

### `progress/{uid}_{itemId}`

One document per student per tracked item.

```
progress/{uid}_{itemId}
  uid: string
  itemId: string
  itemType: "milestone" | "project"
  status: "in_progress" | "done"
  updatedAt: timestamp
```

---

## Authentication Flow

1. A sign-in button appears in `PageHeader` (top corner, RTL-aware)
2. Clicking triggers Google Sign-In via Firebase Auth
3. On first login: user document is created in Firestore with A1 defaults (no onboarding screen needed in phase 2 — cohort is hardcoded)
4. On subsequent logins: existing user document is loaded
5. A signed-in user sees their avatar/name in the header with a sign-out option

Phase 2 skips the cohort-selection screen entirely — all users are A1. The onboarding screen will be introduced in phase 3 when multiple cohorts exist.

---

## Progress Tracking UX

### Logged-out state
- Each `DashboardItem` shows a faint/disabled status indicator
- Clicking it triggers a sign-in prompt: "התחבר כדי לעקוב אחרי ההתקדמות שלך"
- The prompt triggers Google Sign-In

### Logged-in state
- The status indicator is active
- Clicking cycles: `(none) → in_progress → done → (none)`
- State is written to Firestore immediately on each click
- Visual treatment: distinct icon/color per state (e.g. grey dot → yellow clock → green check)

---

## New & Modified Files

| File | Action | Responsibility |
|------|--------|----------------|
| `src/firebase.js` | Modify | Add Firebase Auth init alongside existing Firestore |
| `src/hooks/useAuth.js` | Create | Current user state, Google sign-in, sign-out |
| `src/hooks/useProgress.js` | Create | Read and write progress documents for current user |
| `src/components/PageHeader.jsx` | Modify | Add sign-in button / signed-in avatar + sign-out |
| `src/components/DashboardItem.jsx` | Modify | Add progress status indicator with sign-in prompt or active controls |

No new screens needed for phase 2. Onboarding (cohort selection) is deferred to phase 3.

---

## Seeding

The `cohorts` collection has no admin UI in phase 2. The A1 cohort document (`cohort_viscom_2024_A1`) is seeded manually via a seed script or directly in the Firebase console before launch.

---

## Out of Scope for Phase 2

- Cohort selection screen (hardcoded to A1)
- Per-student course customization (`courseIds` is seeded but not editable)
- `yearIndex` derivation logic (hardcoded to 1)
- Instructor/admin views
- Social features (comments, likes)
- Progress visible to classmates
- Sunday class filtering
