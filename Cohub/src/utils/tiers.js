// src/utils/tiers.js

// Splits a flat list of deadline items into tiers by date.
// If fewer than 2 items fall within 7 days, expands hot window to 14 days.
export function splitIntoTiers(items) {
  const now = new Date()
  const day = 86_400_000

  const past = []
  const upcoming7 = []
  const upcoming14 = []
  const later = []

  for (const item of items) {
    const date = item.dueDate.toDate()
    if (date < now) {
      past.push(item)
    } else {
      const daysUntil = (date - now) / day
      if (daysUntil <= 7) upcoming7.push(item)
      else if (daysUntil <= 14) upcoming14.push(item)
      else later.push(item)
    }
  }

  const sort = arr => [...arr].sort((a, b) => a.dueDate.toDate() - b.dueDate.toDate())
  const sortDesc = arr => [...arr].sort((a, b) => b.dueDate.toDate() - a.dueDate.toDate())

  const hotItems = upcoming7.length >= 2 ? upcoming7 : [...upcoming7, ...upcoming14]
  const laterItems = upcoming7.length >= 2 ? [...upcoming14, ...later] : later

  return {
    hot: sort(hotItems),
    later: sort(laterItems),
    past: sortDesc(past),
  }
}
