import { describe, it, expect } from 'vitest'
import { buildDueItems } from './dueItems'

const due = { toDate: () => new Date(2026, 9, 20) }
const courseMap = { c1: { id: 'c1' } }

describe('buildDueItems', () => {
  it('keeps milestones and turns projects without milestones into items', () => {
    const items = buildDueItems(
      [{ id: 'm1', projectId: 'p1', courseId: 'c1', dueDate: due }],
      [
        { id: 'p1', title: 'פוסטר', courseId: 'c1', dueDate: due },
        { id: 'p2', title: 'אנימציה', courseId: 'c1', dueDate: due },
      ],
      courseMap,
    )
    expect(items.map(i => i.id)).toEqual(['m1', 'project-p2'])
    expect(items[1]).toMatchObject({ projectId: 'p2', projectTitle: '' })
  })

  it('drops items without a dueDate or outside the current semester', () => {
    const items = buildDueItems(
      [{ id: 'm1', projectId: 'p1', courseId: 'old', dueDate: due }],
      [{ id: 'p2', title: 'אנימציה', courseId: 'c1' }],
      courseMap,
    )
    expect(items).toEqual([])
  })
})
