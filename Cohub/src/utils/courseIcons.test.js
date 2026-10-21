import { describe, it, expect } from 'vitest'
import { courseIcon } from './courseIcons'

describe('courseIcon', () => {
  it.each([
    ['גריד', 'grid'],
    ['משחקיות', 'tic-tac-toe-cropped'],
    ['רישום 03 - עיצוב (ספרינט)', 'pencil'],
    ['דימוי', 'candle'],
    ['סטודיו 03', 'chair-2'],
    ['סיפור', 'book'],
  ])('maps %s to the %s icon', (name, icon) => {
    expect(courseIcon({ name })).toMatch(new RegExp(`/${icon}\\.svg`))
  })

  it('falls back to the grad cup for other courses', () => {
    expect(courseIcon({ name: 'תולדות האמנות' })).toMatch(/grad-cup\.svg/)
    expect(courseIcon(undefined)).toMatch(/grad-cup\.svg/)
  })
})
