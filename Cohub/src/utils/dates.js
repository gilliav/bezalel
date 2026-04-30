export function isOverdue(firestoreTimestamp) {
  return firestoreTimestamp.toDate() < new Date()
}

export function formatDateHe(firestoreTimestamp) {
  if (!firestoreTimestamp) return ''

  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(firestoreTimestamp.toDate())
}

export function formatDateShort(firestoreTimestamp) {
  if (!firestoreTimestamp) return ''
  
  return new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    month: 'numeric',
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
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
    d.setDate(d.getDate() + 7)
  }
  return dates
}

export function formatRelativeDateHe(firestoreTimestamp) {
  if (!firestoreTimestamp) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = firestoreTimestamp.toDate()
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / 86_400_000)

  if (diff === -2) return 'שלשום'
  if (diff === -1) return 'אתמול'
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff === 2) return 'מחרתיים'
  if (diff === -7) return 'לפני שבוע'
  if (diff === 7) return 'שבוע'

  const absDiff = Math.abs(diff)

  if (absDiff <= 13) {
    return diff < 0 ? `לפני ${absDiff} ימים` : `${absDiff} ימים`
  }

  if (absDiff <= 83) {
    const weeks = Math.round(absDiff / 7)
    if (weeks === 2) return diff < 0 ? 'לפני שבועיים' : 'שבועיים'
    return diff < 0 ? `לפני ${weeks} שבועות` : `${weeks} שבועות`
  }

  return formatDateHe(firestoreTimestamp)
}
