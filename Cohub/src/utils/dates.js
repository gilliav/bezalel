export function isOverdue(firestoreTimestamp) {
  return firestoreTimestamp.toDate() < new Date()
}

export function formatDateHe(firestoreTimestamp) {
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(firestoreTimestamp.toDate())
}

export function sortByDueDate(a, b) {
  return a.dueDate.toDate() - b.dueDate.toDate()
}

// day index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const HE_DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export function dayIndexToHe(dayIndex) {
  return HE_DAY_NAMES[dayIndex] ?? ''
}

// Returns next `count` dates (as YYYY-MM-DD strings) for the given day index (0–6)
export function nextDatesForDay(dayIndex, count = 6) {
  const target = Number(dayIndex)
  if (isNaN(target)) return []
  const dates = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const diff = (target - d.getDay() + 7) % 7
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff))
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return dates
}
