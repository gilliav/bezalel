# Milestone Creation in ProjectForm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "multi-deadline" toggle to `ProjectForm` that replaces the single due date with a variable list of milestones, both at creation and edit time.

**Architecture:** A toggle in `ProjectForm` switches between single-due-date mode and multi-milestone mode. In multi mode, milestones are managed as local state (array of `{ localId, title, dueDate }`) and written to Firestore as a subcollection after the project doc is saved. On edit, existing milestones are loaded from `useProject` and pre-populate local state; on save they are replaced wholesale (delete-all then re-write).

**Tech Stack:** React, Firebase Firestore (`addDoc`, `deleteDoc`, `collection`, `doc`, `getDocs`), Tailwind CSS, existing UI components (`Input`, `Button`), lucide-react icons.

---

### Task 1: Add toggle + milestone list state to ProjectForm

**Files:**
- Modify: `src/screens/ProjectForm.jsx`

- [ ] **Step 1: Add new state variables**

In `ProjectForm`, after the existing `const [saving, setSaving] = useState(false)` line, add:

```jsx
const [isMultiDeadline, setIsMultiDeadline] = useState(false)
const [localMilestones, setLocalMilestones] = useState([]) // { localId, title, dueDate }
```

- [ ] **Step 2: Initialise state from loaded project on edit**

The existing `useEffect` that loads `project` currently sets `courseId`, `title`, `description`, `dueDate`. Extend it to also initialise multi-deadline state. Replace the existing `useEffect` with:

```jsx
useEffect(() => {
  if (!project) return
  setCourseId(project.courseId ?? '')
  setTitle(project.title ?? '')
  setDescription(project.description ?? '')
  if (project.dueDate) {
    setDueDate(project.dueDate.toDate().toISOString().slice(0, 10))
  }
}, [project])

useEffect(() => {
  if (!project || !isEdit) return
  if (!project.dueDate && milestones.length > 0) {
    setIsMultiDeadline(true)
    setLocalMilestones(
      milestones.map(m => ({
        localId: m.id,
        title: m.title,
        dueDate: m.dueDate.toDate().toISOString().slice(0, 10),
      }))
    )
  }
}, [project, milestones, isEdit])
```

Note: `milestones` comes from `useProject` — it's already available as a destructured value from `const { project, milestones, attachments, loading, error } = useProject(projectId)` which is called on `ProjectDetail`. In `ProjectForm`, `useProject` is called but currently only destructures `project` and `loading`. Update that line to also get `milestones`:

```jsx
const { project, milestones, loading: projectLoading } = useProject(projectId)
```

- [ ] **Step 3: Add helper functions for milestone list manipulation**

After the state declarations, add:

```jsx
function addMilestone() {
  setLocalMilestones(prev => [
    ...prev,
    { localId: Date.now().toString(), title: '', dueDate: '' },
  ])
}

function updateMilestone(localId, field, value) {
  setLocalMilestones(prev =>
    prev.map(m => (m.localId === localId ? { ...m, [field]: value } : m))
  )
}

function removeMilestone(localId) {
  setLocalMilestones(prev => prev.filter(m => m.localId !== localId))
}
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProjectForm.jsx
git commit -m "feat: add isMultiDeadline and localMilestones state to ProjectForm"
```

---

### Task 2: Update submit logic for multi-deadline mode

**Files:**
- Modify: `src/screens/ProjectForm.jsx`

- [ ] **Step 1: Add Firestore imports for milestone writes**

At the top of `ProjectForm.jsx`, the existing Firestore import is:

```js
import { collection, addDoc, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
```

Add `getDocs`, `deleteDoc`, and `query`:

```js
import { collection, addDoc, doc, updateDoc, Timestamp, serverTimestamp, getDocs, deleteDoc, query } from 'firebase/firestore'
```

- [ ] **Step 2: Add helper to write milestones subcollection**

Add this function inside `ProjectForm`, after `uploadAttachment`:

```jsx
async function writeMilestones(projectDocId, projectTitle, courseId) {
  // Delete all existing milestones first
  const snap = await getDocs(query(collection(db, 'projects', projectDocId, 'milestones')))
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))

  // Write current local milestones
  await Promise.all(
    localMilestones.map(m =>
      addDoc(collection(db, 'projects', projectDocId, 'milestones'), {
        title: m.title,
        dueDate: Timestamp.fromDate(new Date(m.dueDate + 'T00:00:00')),
        projectId: projectDocId,
        courseId,
        projectTitle,
      })
    )
  )
}
```

- [ ] **Step 3: Update handleSubmit validation**

At the top of `handleSubmit`, after the `if (!courseId || !title) return` guard, add:

```jsx
if (isMultiDeadline && localMilestones.length === 0) return
if (isMultiDeadline && localMilestones.some(m => !m.title || !m.dueDate)) return
```

- [ ] **Step 4: Update handleSubmit create branch**

Replace the existing create branch inside `handleSubmit`:

```jsx
// Before (existing):
const data = { courseId, title, description, createdAt: serverTimestamp() }
if (dueDateValue) data.dueDate = dueDateValue

const docRef = await addDoc(collection(db, 'projects'), data)

if (attachmentFile) {
  await uploadAttachment(docRef.id, attachmentFile)
}

navigate(`/projects/${docRef.id}`)
```

With:

```jsx
// After:
const data = { courseId, title, description, createdAt: serverTimestamp() }
if (!isMultiDeadline && dueDateValue) data.dueDate = dueDateValue

const docRef = await addDoc(collection(db, 'projects'), data)

if (isMultiDeadline) {
  await writeMilestones(docRef.id, title, courseId)
}

if (attachmentFile) {
  await uploadAttachment(docRef.id, attachmentFile)
}

navigate(`/projects/${docRef.id}`)
```

- [ ] **Step 5: Update handleSubmit edit branch**

Replace the existing edit branch:

```jsx
// Before (existing):
const update = { courseId, title, description }
if (dueDateValue) update.dueDate = dueDateValue
await updateDoc(doc(db, 'projects', projectId), update)
navigate(`/projects/${projectId}`)
```

With:

```jsx
// After:
const update = { courseId, title, description }
if (isMultiDeadline) {
  update.dueDate = null  // clear any existing due date
  await writeMilestones(projectId, title, courseId)
} else {
  if (dueDateValue) update.dueDate = dueDateValue
  // If switching from multi to single and no dueDate set, clear milestones
  if (!dueDateValue) {
    const snap = await getDocs(query(collection(db, 'projects', projectId, 'milestones')))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  }
}
await updateDoc(doc(db, 'projects', projectId), update)
navigate(`/projects/${projectId}`)
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/ProjectForm.jsx
git commit -m "feat: write milestones to Firestore on ProjectForm submit"
```

---

### Task 3: Render toggle and milestone list UI

**Files:**
- Modify: `src/screens/ProjectForm.jsx`

- [ ] **Step 1: Add Trash2 icon import**

At the top of the file, the existing lucide import on ProjectForm is absent (icons are used in ProjectDetail). Add:

```jsx
import { Trash2 } from 'lucide-react'
```

- [ ] **Step 2: Replace due date section with toggle + conditional rendering**

Find the existing due date block (the `<div className="flex flex-col gap-2 border border-border rounded-md p-3">` that starts with "תאריך הגשה"). Replace it entirely with:

```jsx
{/* Multi-deadline toggle */}
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={isMultiDeadline}
    onChange={e => {
      setIsMultiDeadline(e.target.checked)
      if (e.target.checked) {
        setDueDate('')
      } else {
        setLocalMilestones([])
      }
    }}
    className="w-4 h-4 accent-primary"
  />
  <span className="text-base text-muted-foreground font-medium">פרויקט עם כמה שלבים</span>
</label>

{/* Single due date — shown when toggle is off */}
{!isMultiDeadline && (
  <div className="flex flex-col gap-2 border border-border rounded-md p-3">
    <span className="text-base text-muted-foreground font-medium">תאריך הגשה (אופציונלי)</span>
    {quickDates.length > 0 ? (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted-foreground">בחר תאריך ({dayIndexToHe(selectedCourse.day)})</span>
        <div className="flex flex-wrap gap-2">
          {quickDates.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => setDueDate(dueDate === d ? '' : d)}
              className={`text-sm px-2.5 py-1 rounded-full border transition-colors ${
                dueDate === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(new Date(d + 'T00:00:00'))}
            </button>
          ))}
        </div>
        {dueDate && (
          <span className="text-sm text-muted-foreground">
            נבחר: {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dueDate + 'T00:00:00'))}
          </span>
        )}
      </div>
    ) : (
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className="field-input"
        dir="ltr"
      />
    )}
  </div>
)}

{/* Milestone list — shown when toggle is on */}
{isMultiDeadline && (
  <div className="flex flex-col gap-3 border border-border rounded-md p-3">
    <span className="text-base text-muted-foreground font-medium">שלבים</span>

    {localMilestones.map(m => (
      <div key={m.localId} className="flex flex-col gap-2 pb-3 border-b border-border last:border-b-0 last:pb-0">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={m.title}
            onChange={e => updateMilestone(m.localId, 'title', e.target.value)}
            placeholder="שם השלב"
            required
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => removeMilestone(m.localId)}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {quickDates.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">בחר תאריך ({dayIndexToHe(selectedCourse.day)})</span>
            <div className="flex flex-wrap gap-2">
              {quickDates.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => updateMilestone(m.localId, 'dueDate', m.dueDate === d ? '' : d)}
                  className={`text-sm px-2.5 py-1 rounded-full border transition-colors ${
                    m.dueDate === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(new Date(d + 'T00:00:00'))}
                </button>
              ))}
            </div>
            {m.dueDate && (
              <span className="text-sm text-muted-foreground">
                נבחר: {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(m.dueDate + 'T00:00:00'))}
              </span>
            )}
          </div>
        ) : (
          <input
            type="date"
            value={m.dueDate}
            onChange={e => updateMilestone(m.localId, 'dueDate', e.target.value)}
            required
            className="field-input"
            dir="ltr"
          />
        )}
      </div>
    ))}

    <button
      type="button"
      onClick={addMilestone}
      className="action-link text-sm self-start"
    >
      + הוסף שלב
    </button>
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Start the dev server (`npm run dev`), open ProjectForm for a new project:
1. Toggle on — due date disappears, milestone section appears
2. Click "+ הוסף שלב" — row appears with title input and date chips
3. Fill title + pick date
4. Add a second milestone
5. Remove one with trash icon
6. Submit — navigate to ProjectDetail, milestones appear in the list
7. Open edit form — toggle is on, milestones pre-populate
8. Toggle off — milestone list disappears, due date section reappears
9. Submit — ProjectDetail shows single due date, no milestones

- [ ] **Step 4: Commit**

```bash
git add src/screens/ProjectForm.jsx
git commit -m "feat: milestone toggle and list UI in ProjectForm"
```

---

## Self-Review

**Spec coverage:**
- ✅ Toggle on/off — Task 3 Step 2
- ✅ Due date hides when toggle on — Task 3 Step 2
- ✅ `dueDate` clears when toggling on — Task 3 Step 2 (onChange clears `dueDate`)
- ✅ Milestone row: title + date chip + remove icon — Task 3 Step 2
- ✅ "+ הוסף שלב" appends empty row — Task 1 Step 3 + Task 3 Step 2
- ✅ Toggle off clears localMilestones — Task 3 Step 2
- ✅ Create: project saved without dueDate, milestones written after — Task 2 Step 4
- ✅ Edit load: isMultiDeadline init from project+milestones — Task 1 Step 2
- ✅ Edit save: replace-all milestone strategy — Task 2 Step 2 (`writeMilestones` deletes then re-writes)
- ✅ Toggle flip off on edit: deletes milestones from Firestore — Task 2 Step 5
- ✅ Validation: submit blocked if toggle on and zero milestones — Task 2 Step 3
- ✅ Validation: submit blocked if any milestone missing title or dueDate — Task 2 Step 3

**Type consistency:** `localMilestones` uses `{ localId, title, dueDate }` throughout. `writeMilestones` writes `{ title, dueDate: Timestamp, projectId, courseId, projectTitle }` — matches existing milestone shape in `useProject` and `MilestoneItem`.

**Placeholder scan:** None found.
