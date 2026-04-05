# Milestone Creation in ProjectForm — Design Spec
**Date:** 2026-04-05

---

## 1. Problem

Students can currently add milestones to a project only from `ProjectDetail`, after the project is created. There is no way to define a multi-deadline project (one with sub-deadlines instead of a single due date) at creation time.

---

## 2. Goal

Add a "multi-deadline" toggle to `ProjectForm` that lets students declare milestones while creating or editing a project — replacing the single due date with a variable list of titled, dated milestones.

---

## 3. Behaviour

### Toggle

A checkbox/toggle labelled "פרויקט עם כמה שלבים" appears in `ProjectForm` above (or replacing) the due date block.

- **Off (default):** Due date section is visible. No milestones UI shown.
- **On:** Due date section hides. `dueDate` state clears. Milestone list section appears.

Flipping the toggle **off** clears the local `milestones` array (no confirmation needed — changes are not persisted until save).

### Milestone List (when toggle is on)

- Each row: title text input (RTL) + date chip picker (same quick-date pattern as the existing due date field) + remove (trash) icon
- "+ הוסף שלב" button appends a new empty row at the bottom
- Rows can be removed at any point before save
- No reordering — milestones are ordered by `dueDate` on read (Firestore query already does this)

### Validation

- If toggle is on and zero milestones exist, submit is blocked (same UX as the existing required-field guard)
- Each milestone requires both title and dueDate before submit

---

## 4. Data Flow

### Create

1. `addDoc` creates the project doc **without** `dueDate`
2. For each milestone in local state: `addDoc` to `projects/{id}/milestones` with `{ title, dueDate: Timestamp, projectId, courseId, projectTitle }`
3. Navigate to project detail as usual

### Edit (load)

- If loaded project has no `dueDate` **and** `milestones.length > 0` (from `useProject`): initialize `isMultiDeadline = true`, populate local `milestones` from loaded data
- Otherwise: initialize `isMultiDeadline = false` with existing `dueDate`

### Edit (save)

- If `isMultiDeadline` was on: delete all existing milestone docs for this project, then write the current local `milestones` array as new docs. (Replace-all strategy — avoids diffing complexity for a small collection.)
- If `isMultiDeadline` was flipped off: delete all existing milestone docs, save project with the new `dueDate`

---

## 5. State Changes in ProjectForm

New state:
```js
const [isMultiDeadline, setIsMultiDeadline] = useState(false)
const [milestones, setMilestones] = useState([]) // [{ id: localId, title, dueDate }]
```

`dueDate` state remains but is cleared when toggle turns on.

On load (edit mode), `useEffect` on `project` + `milestones` (from `useProject`) initialises both new state values.

---

## 6. Files to Change

| File | Change |
|---|---|
| `src/screens/ProjectForm.jsx` | Add toggle, milestone list UI, updated submit logic |

No changes needed to `useProject.js` (already loads milestones), `ProjectDetail.jsx` (milestone display unchanged), or the data model.

---

## 7. Out of Scope

- Editing individual milestone titles/dates in-place (remove + re-add)
- Reordering milestones manually
- Converting an existing single-deadline project to multi-deadline from `ProjectDetail` (must go through edit form)
