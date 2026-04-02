import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockOnSnapshot = vi.hoisted(() => vi.fn())
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useProject } from './useProject'

describe('useProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns project, milestones, and briefs', async () => {
    let callCount = 0
    mockOnSnapshot.mockImplementation((ref, onNext) => {
      callCount++
      if (callCount === 1) {
        // project doc
        onNext({ exists: () => true, id: 'p1', data: () => ({ title: 'פוסטר', courseId: 'c1' }) })
      } else if (callCount === 2) {
        // milestones
        onNext({ docs: [{ id: 'm1', data: () => ({ title: 'טיוטה' }) }] })
      } else {
        // briefs
        onNext({ docs: [] })
      }
      return vi.fn()
    })

    const { result } = renderHook(() => useProject('p1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.project?.title).toBe('פוסטר')
    expect(result.current.milestones).toHaveLength(1)
    expect(result.current.briefs).toHaveLength(0)
  })
})
