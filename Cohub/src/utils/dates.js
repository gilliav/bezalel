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
