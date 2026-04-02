import { Timestamp } from 'firebase/firestore'
import { isOverdue, formatDateHe, sortByDueDate } from './dates'

const pastTimestamp = Timestamp.fromDate(new Date('2020-01-01'))
const futureTimestamp = Timestamp.fromDate(new Date('2099-01-01'))

describe('isOverdue', () => {
  it('returns true for past dates', () => {
    expect(isOverdue(pastTimestamp)).toBe(true)
  })
  it('returns false for future dates', () => {
    expect(isOverdue(futureTimestamp)).toBe(false)
  })
})

describe('formatDateHe', () => {
  it('returns a non-empty Hebrew string', () => {
    const result = formatDateHe(pastTimestamp)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('sortByDueDate', () => {
  it('sorts ascending by dueDate', () => {
    const items = [
      { dueDate: futureTimestamp },
      { dueDate: pastTimestamp },
    ]
    const sorted = [...items].sort(sortByDueDate)
    expect(sorted[0].dueDate).toBe(pastTimestamp)
  })
})
