# Cohub — Design Spec
**Date:** 2026-04-01  
**Project:** Cohub — Studio Commons  
**Target:** Bezalel Academy, Visual Communication, Cohort A1 (Year 1, Class 1)

---

## 1. Problem

Students in the Vis-Com department navigate briefs, deadlines, and course materials scattered across WhatsApp groups, emails, and physical notes. There is no single source of truth for what needs to be done, when, and where to submit it.

---

## 2. Goal

A shared, mobile-first web app for Cohort A1 that centralizes ongoing projects, milestones, and course briefs. Students crowdsource content — any student can create and edit projects. The primary value is reducing deadline confusion and information fatigue.

---

## 3. Scope (MVP)

- Open access via shared link — no login required
- Cohort A1 only (25 students, 6 courses, Mon–Thu)
- Projects and milestones are the core unit — no per-student progress tracking
- Past/upcoming status is derived purely from milestone due dates

**Out of scope for MVP:**
- Authentication and per-student progress tracking (Phase 2)
- Sunday theory classes (not shared cohort classes)

---

## 4. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite (SPA) | Specified; fast dev experience |
| Database | Firebase Firestore | No inactivity pause, real-time sync, free tier sufficient |
| File storage | Firebase Storage | 5 GB free, no separate service needed |
| Hosting | Firebase Hosting | Simple deployment, same ecosystem |
| Auth | Firebase Auth (initialized, unused) | Ready for Phase 2 OIDC integration |
| Styling | Tailwind CSS + tailwindcss-rtl | RTL-aware utilities, mobile-first |

**Phase 2:** Upgrade to Firebase Blaze plan (pay-as-you-go, same free limits), add OpenAthens/Orbit OIDC provider via Firebase Auth. No architectural rewrite needed.

---

## 5. Data Model

### `courses` (pre-seeded, any student can edit)
```
moodleId     string   — Bezalel Moodle course ID (e.g. "25029-1")
name         string   — Hebrew course name
day          string   — Day of week
hours        string   — Time range (e.g. "10:00-13:00")
lecturer     string   — Lecturer name
location     string   — Room/studio
courseUrl    string   — General course link (Drive, Miro, etc.)
notes        string   — Free text, e.g. "7 שבועות ראשונים"
color        string   — Assigned accent color (hex), set on seed
```

### `projects` (any student can create/edit)
```
courseId     string   — Reference to courses document
title        string   — Project name
description  string   — Optional text description / brief
createdAt    timestamp
```
Projects have no due date. All deadlines live on milestones.

### `milestones` (subcollection under each project)
```
title        string   — Milestone name
dueDate      timestamp
```

### `briefs` (subcollection under each project)
```
fileName     string
fileUrl      string   — Firebase Storage download URL
fileType     string   — "pdf" | "png" | "jpg"
uploadedAt   timestamp
```
Files stored at: `briefs/{projectId}/{fileName}`

---

## 6. Screens

### Dashboard (primary — tab 1: פרויקטים)
A flat, chronological list of all milestones across all projects, sorted by `dueDate` ascending. Each item displays:
- Milestone title
- Parent project name
- Course name + course accent color tag

Overdue milestones (past due date) appear at the top, visually distinct. No grouping buckets — clean sorted list.

### Course View (tab 2: קורסים → course detail)
A vertical timeline. Projects are numbered dots (e.g. "01 — פוסטר טיפוגרפי") in chronological order by their earliest milestone. Milestones are smaller dots nested within each project on the timeline. The current active project (nearest upcoming milestone) is expanded by default; earlier work is scrollable upward. Tapping any dot expands it to show full details.

### Courses List (tab 2: קורסים)
A list of all courses showing day/time, lecturer, and a tappable `courseUrl` link. Tapping a course opens its timeline view. Any student can edit course fields inline.

### Project Detail
Accessible from Dashboard or Course View. Shows: title, parent course, description, list of milestones (chronological), and brief files (downloadable). Buttons to add a milestone, upload a brief, and edit/delete the project.

### New / Edit Project
Form fields: course (dropdown), title, description (optional). Milestones and briefs are added from the detail screen after creation, or inline here if the student wants.

### Schedule (tab 3: לוח זמנים)
Read-only weekly view (Sun–Thu) of class times and rooms, derived from the courses collection. Secondary feature.

---

## 7. Navigation

Bottom tab bar (mobile-first), three tabs:
- **פרויקטים** — Dashboard
- **קורסים** — Courses list
- **לוח זמנים** — Schedule

---

## 8. RTL & Typography

- `dir="rtl"` on HTML root
- Tailwind CSS with `tailwindcss-rtl` plugin for RTL-aware spacing/layout utilities
- System font stack with Hebrew support: `'Segoe UI', Arial, sans-serif`
- Mobile-first layout, max-width container for tablet/desktop
- Each course has an assigned accent color (set at seed time) used consistently across timeline dots and dashboard tags

---

## 9. File Uploads

- Direct browser → Firebase Storage upload
- Supported types: PDF, PNG, JPG
- Firestore `briefs` entry written after upload completes (stores download URL)
- No explicit size limit in MVP — Firebase Storage 5 GB free tier is the practical cap

---

## 10. Error Handling

- Firestore/Storage errors shown as Hebrew toast notifications
- No offline support in MVP — connection loss shows a banner
- Form validation: course, milestone title, and due date are required fields; block submission if missing

---

## 11. Initial Data Seed

Courses are pre-seeded from `schedule-A1-Gilli.csv`. Sunday classes (theory/electives) are excluded from the seed as they are not shared cohort classes.

Seeded courses (Mon–Thu):
| Course | Moodle ID | Day |
|---|---|---|
| טיפוגרפיה א' | 25029-1 | Monday |
| תנועה | 50107-10 | Monday |
| איור א'1 | 50137-1 | Tuesday |
| ממשק א'1 | 50139-1 | Tuesday |
| מיומנויות דיגיטליות | 50136-1 | Wednesday (first 7 weeks) |
| רישום 03 - צבע | 50134-1 | Wednesday (last 7 weeks) |
| סטודיו זמן 02 | 50138-1 | Thursday |

`courseUrl`, `notes`, and `color` are set during seed. `courseUrl` and `notes` are editable by any student post-seed.
