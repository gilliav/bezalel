import { describe, it, expect } from 'vitest'
import { dateKey, monthWeeks, groupByDay } from './calendar'

describe('dateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('monthWeeks', () => {
  it('starts weeks on Sunday and pads days outside the month with null', () => {
    // October 2026 starts on a Thursday and has 31 days
    const weeks = monthWeeks(2026, 9)
    expect(weeks).toHaveLength(5)
    expect(weeks[0].slice(0, 4)).toEqual([null, null, null, null])
    expect(weeks[0][4].getDate()).toBe(1)
    expect(weeks[4][6].getDate()).toBe(31)
    weeks.forEach(w => expect(w).toHaveLength(7))
  })
})

describe('groupByDay', () => {
  it('groups items by day and sorts each day by time', () => {
    const at = (h) => ({ toDate: () => new Date(2026, 9, 20, h) })
    const byDay = groupByDay([
      { id: 'late', dueDate: at(18) },
      { id: 'early', dueDate: at(9) },
    ])
    expect(byDay['2026-10-20'].map(i => i.id)).toEqual(['early', 'late'])
  })
})
