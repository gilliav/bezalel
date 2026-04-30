import { Timestamp } from 'firebase/firestore'
import { isOverdue, formatDateHe, sortByDueDate, formatRelativeDateHe } from './dates'

// Helper: Firestore Timestamp N days from today (local-date-aligned, matches formatRelativeDateHe)
function tsOffsetDays(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return Timestamp.fromDate(d)
}

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

describe('formatRelativeDateHe', () => {
  it('returns היום for today', () => {
    expect(formatRelativeDateHe(tsOffsetDays(0))).toBe('היום')
  })
  it('returns אתמול for -1 day', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-1))).toBe('אתמול')
  })
  it('returns מחר for +1 day', () => {
    expect(formatRelativeDateHe(tsOffsetDays(1))).toBe('מחר')
  })
  it('returns שלשום for -2 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-2))).toBe('שלשום')
  })
  it('returns מחרתיים for +2 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(2))).toBe('מחרתיים')
  })
  it('returns לפני N ימים for -5 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-5))).toBe('לפני 5 ימים')
  })
  it('returns N ימים for +5 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(5))).toBe('5 ימים')
  })
  it('returns לפני N ימים for -10 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-10))).toBe('לפני 10 ימים')
  })
  it('returns N ימים for +10 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(10))).toBe('10 ימים')
  })
  it('returns לפני שבוע for -7 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-7))).toBe('לפני שבוע')
  })
  it('returns שבוע for +7 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(7))).toBe('שבוע')
  })
  it('returns לפני שבועיים for -14 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-14))).toBe('לפני שבועיים')
  })
  it('returns שבועיים for +14 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(14))).toBe('שבועיים')
  })
  it('returns לפני N שבועות for -21 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-21))).toBe('לפני 3 שבועות')
  })
  it('returns N שבועות for +28 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(28))).toBe('4 שבועות')
  })
  it('returns N שבועות for +83 days (last relative value)', () => {
    expect(formatRelativeDateHe(tsOffsetDays(83))).toBe('12 שבועות')
  })
  it('falls back to absolute date for +84 days (first absolute value)', () => {
    const ts = tsOffsetDays(84)
    expect(formatRelativeDateHe(ts)).toBe(formatDateHe(ts))
  })
  it('falls back to absolute date for a far future date', () => {
    const ts = Timestamp.fromDate(new Date('2099-06-15'))
    expect(formatRelativeDateHe(ts)).toBe(formatDateHe(ts))
  })
  it('falls back to absolute date for a far past date', () => {
    const ts = Timestamp.fromDate(new Date('2020-01-01'))
    expect(formatRelativeDateHe(ts)).toBe(formatDateHe(ts))
  })
})
