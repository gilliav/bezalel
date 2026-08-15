import { describe, it, expect } from 'vitest'
import { computeAggregate, groupRatingsByCourseCode, getAttendanceLabel } from './catalogAggregate'

describe('computeAggregate', () => {
  it('returns all-null aggregate when there are no ratings', () => {
    expect(computeAggregate([])).toEqual({
      count: 0,
      recommendPercent: null,
      profGood: null,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTakenPercent: null,
    })
  })

  it('ignores notTaken docs when computing count and averages', () => {
    const ratings = [
      { status: 'notTaken' },
      { status: 'rated', recommend: true, profGood: 5 },
    ]
    expect(computeAggregate(ratings).count).toBe(1)
  })

  it('computes recommend percent rounded to nearest integer', () => {
    const ratings = [
      { status: 'rated', recommend: true },
      { status: 'rated', recommend: true },
      { status: 'rated', recommend: false },
    ]
    expect(computeAggregate(ratings).recommendPercent).toBe(67)
  })

  it('averages numeric scale fields, ignoring ratings that omitted them', () => {
    const ratings = [
      { status: 'rated', recommend: true, profGood: 4 },
      { status: 'rated', recommend: true, profGood: 2 },
      { status: 'rated', recommend: true, profGood: null },
    ]
    expect(computeAggregate(ratings).profGood).toBe(3)
  })

  it('computes attendanceTakenPercent only from ratings that answered it', () => {
    const ratings = [
      { status: 'rated', recommend: true, attendanceTaken: true },
      { status: 'rated', recommend: true, attendanceTaken: false },
      { status: 'rated', recommend: true, attendanceTaken: null },
    ]
    expect(computeAggregate(ratings).attendanceTakenPercent).toBe(50)
  })
})

describe('getAttendanceLabel', () => {
  it('returns null when there is no data', () => {
    expect(getAttendanceLabel(null)).toBe(null)
  })

  it('returns כן for percentages over 80', () => {
    expect(getAttendanceLabel(85)).toBe('כן')
  })

  it('returns לא for percentages under 20', () => {
    expect(getAttendanceLabel(12)).toBe('לא')
  })

  it('returns לא ברור for percentages in between, inclusive of the 20 and 80 boundaries', () => {
    expect(getAttendanceLabel(74)).toBe('לא ברור')
    expect(getAttendanceLabel(80)).toBe('לא ברור')
    expect(getAttendanceLabel(20)).toBe('לא ברור')
  })
})

describe('groupRatingsByCourseCode', () => {
  it('groups ratings by their courseCode', () => {
    const ratings = [
      { courseCode: 'A', id: '1' },
      { courseCode: 'B', id: '2' },
      { courseCode: 'A', id: '3' },
    ]
    expect(groupRatingsByCourseCode(ratings)).toEqual({
      A: [{ courseCode: 'A', id: '1' }, { courseCode: 'A', id: '3' }],
      B: [{ courseCode: 'B', id: '2' }],
    })
  })

  it('returns an empty object for an empty list', () => {
    expect(groupRatingsByCourseCode([])).toEqual({})
  })
})
