export const COURSE_COLORS = [
  '#E63946', // Typography
  '#457B9D', // Motion
  '#2A9D8F', // Illustration
  '#E9C46A', // Interface
  '#F4A261', // Digital Skills
  '#A8DADC', // Color Drawing
  '#6D6875', // Studio Time
]

export function getCourseColor(index) {
  return COURSE_COLORS[index % COURSE_COLORS.length]
}
