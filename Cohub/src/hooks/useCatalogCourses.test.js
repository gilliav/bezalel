import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockOnSnapshot = vi.hoisted(() => vi.fn())

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useCatalogCourses } from './useCatalogCourses'

describe('useCatalogCourses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns courses from the catalogCourses Firestore snapshot', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: '1700686', data: () => ({ name: 'תולדות האיור', lecturer: 'אורנה גרנות' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.courses).toEqual([
      { id: '1700686', name: 'תולדות האיור', lecturer: 'אורנה גרנות' },
    ])
  })

  it('sets error state on snapshot failure', async () => {
    mockOnSnapshot.mockImplementation((q, onNext, onError) => {
      onError(new Error('permission denied'))
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
