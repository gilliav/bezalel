// Local-date key (YYYY-MM-DD) used to group items by day.
export function dateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Weeks of a month, Sunday first. Each week has 7 slots; days outside the
// month are null.
export function monthWeeks(year, month) {
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const slots = Array(first.getDay()).fill(null)
  for (let d = 1; d <= daysInMonth; d++) slots.push(new Date(year, month, d))
  while (slots.length % 7) slots.push(null)

  const weeks = []
  for (let i = 0; i < slots.length; i += 7) weeks.push(slots.slice(i, i + 7))
  return weeks
}

// Groups items with a Firestore `dueDate` by local day key, each day sorted by time.
export function groupByDay(items) {
  const byDay = {}
  for (const item of items) {
    const key = dateKey(item.dueDate.toDate())
    ;(byDay[key] ??= []).push(item)
  }
  for (const key in byDay) byDay[key].sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate())
  return byDay
}

export function formatMonthHe(year, month) {
  return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))
}

export function formatDayHe(date) {
  return new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}
