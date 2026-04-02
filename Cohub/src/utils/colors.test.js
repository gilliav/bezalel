import { getCourseColor, COURSE_COLORS } from './colors'

describe('getCourseColor', () => {
  it('returns the color at the given index', () => {
    expect(getCourseColor(0)).toBe(COURSE_COLORS[0])
    expect(getCourseColor(2)).toBe(COURSE_COLORS[2])
  })

  it('wraps around if index exceeds array length', () => {
    expect(getCourseColor(7)).toBe(COURSE_COLORS[0])
    expect(getCourseColor(8)).toBe(COURSE_COLORS[1])
  })
})
