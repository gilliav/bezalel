import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockOnSnapshot = vi.hoisted(() => vi.fn())

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useCourses } from './useCourses'

describe('useCourses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns courses from Firestore snapshot', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: 'c1', data: () => ({ name: 'טיפוגרפיה א׳', color: '#E63946' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.courses).toEqual([
      { id: 'c1', name: 'טיפוגרפיה א׳', color: '#E63946' },
    ])
  })

  it('sets error state on snapshot failure', async () => {
    mockOnSnapshot.mockImplementation((q, onNext, onError) => {
      onError(new Error('permission denied'))
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
