# Attachments & Milestone Descriptions — Design Spec
Date: 2026-04-06

## Overview

Allow multiple file attachments and a text description on both projects and milestones. Attachments can be added at creation time and managed (add/delete) afterwards.

---

## Data Model

### Project attachments (unchanged)
Subcollection: `projects/{projectId}/attachments`
```
{ fileName: string, fileUrl: string, fileType: string, uploadedAt: Timestamp }
```

### Milestone description (new field)
Stored on the milestone document alongside existing fields:
```
{ title, dueDate, projectId, courseId, projectTitle, description?: string }
```

### Milestone attachments (new subcollection)
`projects/{projectId}/milestones/{milestoneId}/attachments`
```
{ fileName: string, fileUrl: string, fileType: string, uploadedAt: Timestamp }
```

### Firebase Storage path for milestone files
`attachments/{projectId}/milestones/{milestoneId}/{timestamp}_{fileName}`

---

## Components

### `FileUpload` — changes
- Add `multiple?: boolean` prop. When true, `<input multiple>` and uploads loop sequentially.
- Add `onUploadComplete?: () => void` callback fired after all files in a batch finish.
- Single-file behavior (no `multiple` prop) unchanged.

### `AttachmentList` — new component
Extracted from ProjectDetail's inline attachment rendering.

**Props:**
```
attachments: Array<{ id, fileName, fileUrl, fileType }>
onDelete?: (attachment) => void   // omit to hide delete UI
```

**Behavior:**
- Images: inline thumbnail, click to open lightbox
- PDFs: iframe preview with expand button → lightbox
- Other: download link
- Lightbox: full-screen overlay with close button (moved from ProjectDetail state)
- If `onDelete` provided: show a delete button per attachment; handler deletes from Firestore and Firebase Storage

**Used in:** ProjectDetail (project-level), ProjectDetail (per-milestone), ProjectForm (edit mode per attachment and per milestone).

---

## ProjectForm changes

### Project attachment section
- **Create mode:** Multi-file picker (replace single-file). Files queued in state, uploaded after project doc is created.
- **Edit mode (new):** Show existing attachments via `AttachmentList` with delete. Multi-file picker below to add more — uploads immediately on selection.

### Milestone rows (both create and edit)
Each milestone row gains:
- `description` textarea (optional)
- Multi-file picker

**Create flow:** Files are stored in local state keyed by `localId`. After the milestone doc is written, files upload to the milestone's subcollection.

**Edit flow:** Show existing `description` and `AttachmentList` per milestone (loaded from `useProject`). New files upload immediately on selection.

> **Important:** ProjectForm's current `writeMilestones` function deletes all milestone docs and rewrites them, losing existing attachments. The edit flow must be changed to update existing milestone docs in-place (by doc ID) rather than delete+recreate. Local milestone state must carry the Firestore doc ID when editing so it can be used for `updateDoc` instead of `addDoc`.

---

## ProjectDetail changes

### Inline add-milestone form
- Add `description` textarea field
- Add multi-file picker
- After `addDoc` creates the milestone, upload any selected files to the new milestone's subcollection and save `description` if provided

### Milestone display
- Each milestone row shows `description` (if present) and `AttachmentList` (if attachments exist) below the title/date
- No expand/collapse — show inline (milestones typically have 0–1 attachment)

---

## `useProject` hook changes

Subscribe to each milestone's `attachments` subcollection. Two options:
1. After milestones snapshot resolves, open one `onSnapshot` per milestone's attachments subcollection
2. Store milestone attachments in a map keyed by milestoneId: `milestoneAttachments: { [milestoneId]: Attachment[] }`

Return shape addition:
```js
milestoneAttachments: { [milestoneId]: Attachment[] }
```

Subscriptions are cleaned up when milestones change or component unmounts.

---

## Firestore Security Rules

Existing rules allow read/write on `projects/{projectId}/attachments`. Extend to also allow:
- `projects/{projectId}/milestones/{milestoneId}/attachments` — same auth conditions

---

## Out of Scope
- Attachment reordering
- File size limits (handled by Firebase Storage rules, not in-app)
- Progress bar per-file in multi-upload (show aggregate "מעלה..." state)
- Attachment editing (rename)
