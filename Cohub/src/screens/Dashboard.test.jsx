import { splitIntoTiers } from './Dashboard'

const future7 = { toDate: () => new Date(Date.now() + 3 * 86_400_000) }
const future10 = { toDate: () => new Date(Date.now() + 10 * 86_400_000) }
const future20 = { toDate: () => new Date(Date.now() + 20 * 86_400_000) }
const past = { toDate: () => new Date(Date.now() - 86_400_000) }

const p = (id, dueDate) => ({ id, courseId: 'c1', title: `proj ${id}`, dueDate })

it('places project due in 3 days in hot tier', () => {
  const { hot } = splitIntoTiers([p('1', future7)], { '1': null })
  expect(hot).toHaveLength(1)
})

it('places overdue project in past tier', () => {
  const { past: pastTier } = splitIntoTiers([p('1', past)], { '1': null })
  expect(pastTier).toHaveLength(1)
})

it('places project due in 20 days in later tier', () => {
  const { later } = splitIntoTiers([p('1', future20)], { '1': null })
  expect(later).toHaveLength(1)
})

it('expands hot to 14 days when fewer than 2 items in 7-day window', () => {
  const projects = [p('1', future7), p('2', future10)]
  const { hot } = splitIntoTiers(projects, { '1': null, '2': null })
  expect(hot).toHaveLength(2)
})

it('uses nextMilestone date for tier placement when project has milestones', () => {
  const project = p('1', null)
  const nextMs = { title: 'שלב א׳', index: 1, dueDate: future7 }
  const { hot } = splitIntoTiers([project], { '1': nextMs })
  expect(hot).toHaveLength(1)
})
