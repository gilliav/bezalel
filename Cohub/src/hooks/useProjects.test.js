import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockOnSnapshot = vi.hoisted(() => vi.fn())
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useProjects } from './useProjects'

describe('useProjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns projects for a given courseId', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [{ id: 'p1', data: () => ({ title: 'פוסטר', courseId: 'c1' }) }],
      })
      return vi.fn()
    })

    const { result } = renderHook(() => useProjects('c1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.projects).toEqual([{ id: 'p1', title: 'פוסטר', courseId: 'c1' }])
  })

  it('does not subscribe when courseId is falsy', () => {
    renderHook(() => useProjects(null))
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })
})
