import { splitIntoTiers } from './Dashboard'

const future7 = { toDate: () => new Date(Date.now() + 3 * 86_400_000) }
const future10 = { toDate: () => new Date(Date.now() + 10 * 86_400_000) }
const future20 = { toDate: () => new Date(Date.now() + 20 * 86_400_000) }
const past = { toDate: () => new Date(Date.now() - 86_400_000) }

const item = (id, dueDate) => ({ id, projectId: id, courseId: 'c1', title: `item ${id}`, projectTitle: '', dueDate })

it('places item due in 3 days in hot tier', () => {
  const { hot } = splitIntoTiers([item('1', future7)])
  expect(hot).toHaveLength(1)
})

it('places overdue item in past tier', () => {
  const { past: pastTier } = splitIntoTiers([item('1', past)])
  expect(pastTier).toHaveLength(1)
})

it('places item due in 20 days in later tier', () => {
  const { later } = splitIntoTiers([item('1', future20)])
  expect(later).toHaveLength(1)
})

it('expands hot to 14 days when fewer than 2 items in 7-day window', () => {
  const { hot } = splitIntoTiers([item('1', future7), item('2', future10)])
  expect(hot).toHaveLength(2)
})

it('does not expand hot when 2+ items already in 7-day window', () => {
  const { hot, later } = splitIntoTiers([item('1', future7), item('2', future7), item('3', future10)])
  expect(hot).toHaveLength(2)
  expect(later).toHaveLength(1)
})
