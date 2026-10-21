// Builds the list of due items (milestones + standalone projects) shown on the
// projects screens.
// Projects that have milestones are represented via their milestone rows.
// Only include a project as a standalone item if it has a top-level dueDate
// AND no milestones attached to it.
// See: docs/superpowers/plans/2026-04-07-dashboard-refactor.md — Domain Knowledge
export function buildDueItems(milestones, projects, courseMap) {
  const projectsWithMilestones = new Set(milestones.map(m => m.projectId))
  const projectItems = projects
    .filter(p => p.dueDate && !projectsWithMilestones.has(p.id))
    .map(p => ({
      id: `project-${p.id}`,
      projectId: p.id,
      title: p.title,
      projectTitle: '',
      dueDate: p.dueDate,
      courseId: p.courseId,
    }))

  // Only include items that have a valid dueDate (guard against corrupt data)
  // and hide items from courses outside the current semester.
  return [...milestones, ...projectItems].filter(i => i.dueDate?.toDate && courseMap[i.courseId])
}
