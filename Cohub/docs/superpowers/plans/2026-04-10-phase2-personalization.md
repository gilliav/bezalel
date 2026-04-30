# Phase 2: Personalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in Google Sign-In and per-student progress tracking (not started / in progress / done) on dashboard items, without breaking the existing public app.

**Architecture:** Firebase Auth (Google) handles sign-in. A `useAuth` hook exposes the current user and sign-in/out methods. A `useProgress` hook reads and writes per-student progress documents in Firestore. `DashboardItem` gains a progress indicator — disabled with a sign-in prompt when logged out, interactive when logged in. `PageHeader` gets a sign-in button or signed-in avatar. On first login, a user document is created with hardcoded A1 defaults.

**Tech Stack:** React 18, Firebase Auth (Google provider), Firestore, Tailwind CSS, Lucide React icons, Vitest + Testing Library.

---

## Domain Knowledge

- `src/firebase.js` already exports `auth` (from `getAuth(app)`). No change needed there.
- `DashboardItem` renders one deadline row — milestone or project. It receives `item` and `course` props.
- `PageHeader` is used on every screen. Its `action` prop renders a slot on the right side (the app is RTL). Sign-in should go in this slot on Dashboard only, or as a persistent element in the header itself.
- Progress doc ID is `{uid}_{itemId}`. Missing doc = `not_started`. Cycling back to `not_started` deletes the doc.
- All phase 2 users are hardcoded to cohort `cohort_viscom_2026_A1`, `department: "visual_communication"`, `yearIndex: 1`. The cohort doc must exist in Firestore (see Task 1).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/seed/seedCohort.js` | **Create** | One-time script to seed the A1 cohort document |
| `src/context/AuthContext.jsx` | **Create** | React context providing current user, signIn, signOut |
| `src/hooks/useAuth.js` | **Create** | Convenience hook wrapping `useContext(AuthContext)` |
| `src/hooks/useProgress.js` | **Create** | Read and write progress docs for the current user |
| `src/hooks/useProgress.test.js` | **Create** | Unit tests for useProgress logic |
| `src/components/ProgressIndicator.jsx` | **Create** | Clickable status button (not_started / in_progress / done) |
| `src/components/PageHeader.jsx` | **Modify** | Add `authSlot` prop for sign-in button / avatar |
| `src/components/DashboardItem.jsx` | **Modify** | Add progress indicator using useAuth + useProgress |
| `src/screens/Dashboard.jsx` | **Modify** | Pass sign-in button / avatar into PageHeader |
| `src/main.jsx` | **Modify** | Wrap app in AuthProvider |

---

## Task 1: Seed the A1 cohort document

The `cohorts` collection must exist before first login so the user-creation flow can reference it.

**Files:**
- Create: `src/seed/seedCohort.js`

- [ ] **Step 1: Check existing course IDs**

Run: `node -e "import('./src/seed/seedCourses.js')"` — or just open `src/seed/seedCourses.js` and note the course `moodleId` values. The cohort's `courseIds` should match the Firestore document IDs of the courses already seeded. Open the Firebase console → Firestore → `courses` collection and copy the document IDs into the seed below.

- [ ] **Step 2: Create the seed script**

```js
// src/seed/seedCohort.js
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const COHORT_ID = 'cohort_viscom_2026_A1'

// Replace these with the actual Firestore document IDs from the `courses` collection
const COURSE_IDS = [
  // e.g. 'abc123', 'def456'
  // Open Firebase console → Firestore → courses → copy doc IDs
]

await db.collection('cohorts').doc(COHORT_ID).set({
  displayName: "א'1",
  department: 'visual_communication',
  year: 2024,
  courseIds: COURSE_IDS,
})

console.log(`Seeded cohort: ${COHORT_ID}`)
process.exit(0)
```

- [ ] **Step 3: Add seed script to package.json**

In `package.json`, add to `"scripts"`:
```json
"seed:cohort": "node src/seed/seedCohort.js"
```

- [ ] **Step 4: Run the seed**

```bash
npm run seed:cohort
```

Expected output: `Seeded cohort: cohort_viscom_2026_A1`

Verify in Firebase console → Firestore → `cohorts` collection that the document exists.

- [ ] **Step 5: Commit**

```bash
git add src/seed/seedCohort.js package.json
git commit -m "feat: add seedCohort script for A1 cohort"
```

---

## Task 2: AuthContext and useAuth hook

Provides current user state, Google sign-in, and sign-out to the whole app.

**Files:**
- Create: `src/context/AuthContext.jsx`
- Create: `src/hooks/useAuth.js`
- Modify: `src/main.jsx`

- [ ] **Step 1: Create AuthContext**

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

const COHORT_ID = 'cohort_viscom_2026_A1'

async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  // First login — seed user document with A1 defaults
  const cohortSnap = await getDoc(doc(db, 'cohorts', COHORT_ID))
  const courseIds = cohortSnap.exists() ? cohortSnap.data().courseIds : []

  await setDoc(ref, {
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    cohortId: COHORT_ID,
    department: 'visual_communication',
    yearIndex: 1,
    courseIds,
    createdAt: serverTimestamp(),
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await ensureUserDoc(firebaseUser)
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
    })
  }, [])

  function signIn() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  function signOutUser() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
```

- [ ] **Step 2: Create useAuth hook**

```js
// src/hooks/useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 3: Read current main.jsx**

Open `src/main.jsx` and note the existing provider structure before editing.

- [ ] **Step 4: Wrap app in AuthProvider**

In `src/main.jsx`, import `AuthProvider` and wrap the existing tree:

```jsx
import { AuthProvider } from './context/AuthContext'

// wrap the existing <BrowserRouter> (or root component) with <AuthProvider>:
root.render(
  <AuthProvider>
    {/* existing providers/router here */}
  </AuthProvider>
)
```

- [ ] **Step 5: Commit**

```bash
git add src/context/AuthContext.jsx src/hooks/useAuth.js src/main.jsx
git commit -m "feat: add AuthContext and useAuth for Google Sign-In"
```

---

## Task 3: useProgress hook

Reads and writes progress documents for the currently signed-in user.

**Files:**
- Create: `src/hooks/useProgress.js`
- Create: `src/hooks/useProgress.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/hooks/useProgress.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { progressDocId, nextStatus } from '../hooks/useProgress'

describe('progressDocId', () => {
  it('combines uid and itemId with underscore', () => {
    expect(progressDocId('user123', 'item456')).toBe('user123_item456')
  })
})

describe('nextStatus', () => {
  it('goes from not_started to in_progress', () => {
    expect(nextStatus('not_started')).toBe('in_progress')
  })

  it('goes from in_progress to done', () => {
    expect(nextStatus('in_progress')).toBe('done')
  })

  it('goes from done back to not_started', () => {
    expect(nextStatus('done')).toBe('not_started')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- useProgress
```

Expected: FAIL — `progressDocId` and `nextStatus` are not defined.

- [ ] **Step 3: Create useProgress hook**

```js
// src/hooks/useProgress.js
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function progressDocId(uid, itemId) {
  return `${uid}_${itemId}`
}

export function nextStatus(current) {
  if (current === 'not_started') return 'in_progress'
  if (current === 'in_progress') return 'done'
  return 'not_started'
}

// Returns a map of itemId → status for the current user.
// Items with no document are implicitly 'not_started'.
export function useProgress(uid) {
  const [progressMap, setProgressMap] = useState({})

  useEffect(() => {
    if (!uid) {
      setProgressMap({})
      return
    }

    const q = query(collection(db, 'progress'), where('uid', '==', uid))
    return onSnapshot(q, (snap) => {
      const map = {}
      snap.docs.forEach(d => {
        map[d.data().itemId] = d.data().status
      })
      setProgressMap(map)
    })
  }, [uid])

  async function cycleProgress(itemId, itemType) {
    if (!uid) return
    const current = progressMap[itemId] ?? 'not_started'
    const next = nextStatus(current)
    const ref = doc(db, 'progress', progressDocId(uid, itemId))

    if (next === 'not_started') {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { uid, itemId, itemType, status: next, updatedAt: serverTimestamp() })
    }
  }

  return { progressMap, cycleProgress }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- useProgress
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useProgress.js src/hooks/useProgress.test.js
git commit -m "feat: add useProgress hook with cycleProgress and tests"
```

---

## Task 4: ProgressIndicator component

A small, self-contained button showing the current status and cycling on click.

**Files:**
- Create: `src/components/ProgressIndicator.jsx`

- [ ] **Step 1: Create the component**

```jsx
// src/components/ProgressIndicator.jsx
import { Circle, Clock, CheckCircle } from 'lucide-react'

const CONFIG = {
  not_started: {
    icon: Circle,
    className: 'text-muted-foreground opacity-30',
    label: 'לא התחלתי',
  },
  in_progress: {
    icon: Clock,
    className: 'text-amber-500',
    label: 'בתהליך',
  },
  done: {
    icon: CheckCircle,
    className: 'text-green-600',
    label: 'סיימתי',
  },
}

// status: 'not_started' | 'in_progress' | 'done'
// onCycle: () => void — called when user clicks to advance status
// onSignInPrompt: () => void — called when user is logged out and clicks
export function ProgressIndicator({ status = 'not_started', onCycle, onSignInPrompt }) {
  const isLoggedOut = !onCycle
  const { icon: Icon, className, label } = CONFIG[status]

  function handleClick(e) {
    e.preventDefault() // prevent Link navigation from parent
    if (isLoggedOut) {
      onSignInPrompt?.()
    } else {
      onCycle()
    }
  }

  return (
    <button
      onClick={handleClick}
      title={isLoggedOut ? 'התחבר כדי לעקוב אחרי ההתקדמות שלך' : label}
      className={`flex items-center justify-center p-1 rounded transition-opacity hover:opacity-80 ${className}`}
      aria-label={isLoggedOut ? 'התחבר כדי לעקוב אחרי ההתקדמות שלך' : label}
    >
      <Icon size={18} />
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProgressIndicator.jsx
git commit -m "feat: add ProgressIndicator component"
```

---

## Task 5: Wire ProgressIndicator into DashboardItem

**Files:**
- Modify: `src/components/DashboardItem.jsx`

- [ ] **Step 1: Update DashboardItem**

Replace the contents of `src/components/DashboardItem.jsx` with:

```jsx
// src/components/DashboardItem.jsx
import { Link } from 'react-router-dom'
import { ChevronsLeftIcon } from 'lucide-react'
import { isOverdue } from '../utils/dates'
import { Tag } from './ui/tag'
import { DateTag } from './DateTag'
import { ProgressIndicator } from './ProgressIndicator'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'

export function DashboardItem({ item, course }) {
  const overdue = isOverdue(item.dueDate)
  const isMilestone = Boolean(item.projectTitle)
  const { user, signIn } = useAuth()
  const { progressMap, cycleProgress } = useProgress(user?.uid ?? null)

  const status = progressMap[item.id] ?? 'not_started'
  const itemType = isMilestone ? 'milestone' : 'project'

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
          status={status}
          onCycle={user ? () => cycleProgress(item.id, itemType) : undefined}
          onSignInPrompt={user ? undefined : signIn}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the app renders**

```bash
npm run dev
```

Open the dashboard. Each item should show a faint grey circle on the left side of the date. Clicking while logged out should trigger Google Sign-In popup.

- [ ] **Step 3: Commit**

```bash
git add src/components/DashboardItem.jsx
git commit -m "feat: add progress indicator to DashboardItem"
```

---

## Task 6: Sign-in button and user avatar in PageHeader

**Files:**
- Modify: `src/components/PageHeader.jsx`
- Modify: `src/screens/Dashboard.jsx`

- [ ] **Step 1: Update PageHeader to accept an authSlot prop**

```jsx
// src/components/PageHeader.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function PageHeader({ title, action, hasBackButton, authSlot }) {
  const navigate = useNavigate()

  return (
    <header className="page-header">
      {hasBackButton && (
        <button onClick={() => navigate(-1)} className="back-button">
          <ChevronRight size={16} />
        </button>
      )}
      <h1>{title}</h1>
      <div className="flex items-center gap-2">
        {action && <div>{action}</div>}
        {authSlot && <div>{authSlot}</div>}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create the auth slot UI in Dashboard**

In `src/screens/Dashboard.jsx`, import `useAuth` and pass an auth slot to `PageHeader`:

```jsx
import { useAuth } from '../hooks/useAuth'

// inside the Dashboard component, before the return:
const { user, signIn, signOut } = useAuth()

const authSlot = user ? (
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
```

Then update the `PageHeader` call:

```jsx
<PageHeader
  title="הגשות"
  action={<Link to="/projects/new" className="action-link text-sm">+ פרויקט חדש</Link>}
  authSlot={authSlot}
/>
```

- [ ] **Step 3: Verify sign-in flow end to end**

```bash
npm run dev
```

- Click "התחבר" → Google Sign-In popup opens → sign in
- Header shows first name + avatar
- Click a progress indicator → cycles to in_progress (yellow clock)
- Click again → done (green check)
- Click again → back to not_started (grey circle, doc deleted in Firestore)
- Click avatar/name → signs out → header returns to "התחבר"

- [ ] **Step 4: Commit**

```bash
git add src/components/PageHeader.jsx src/screens/Dashboard.jsx
git commit -m "feat: add sign-in button and user avatar to Dashboard header"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Firebase Auth (Google) — Task 2
- ✅ User doc created on first login with A1 defaults — Task 2 (`ensureUserDoc`)
- ✅ `cohorts` collection seeded — Task 1
- ✅ `users` collection with all required fields — Task 2
- ✅ `progress` collection with correct shape — Task 3
- ✅ Missing doc = not_started — Task 3 (`progressMap[id] ?? 'not_started'`)
- ✅ Cycling to not_started deletes doc — Task 3 (`deleteDoc`)
- ✅ Sign-in button in PageHeader — Task 6
- ✅ Signed-in avatar + sign-out — Task 6
- ✅ Progress indicator on DashboardItem — Tasks 4 + 5
- ✅ Logged-out click triggers sign-in prompt — Tasks 4 + 5
- ✅ Logged-in click cycles status — Tasks 4 + 5
- ✅ App remains public (no auth gate) — confirmed, all changes are additive
