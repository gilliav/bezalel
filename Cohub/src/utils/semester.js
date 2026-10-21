// The semester the app shows. Courses without a `semester` field predate this
// and belong to א1. Bump this when a new semester starts.
export const CURRENT_SEMESTER = 'ב1'
export const LEGACY_SEMESTER = 'א1'

export function isCurrentSemester(course) {
  return (course.semester ?? LEGACY_SEMESTER) === CURRENT_SEMESTER
}
