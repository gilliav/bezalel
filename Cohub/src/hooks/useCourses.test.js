


import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockOnSnapshot = vi.hoisted(() => vi.fn())

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useCourses } from './useCourses'

describe('useCourses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns courses from Firestore snapshot', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: 'c1', data: () => ({ name: 'טיפוגרפיה א׳', color: '#E63946', semester: 'ב1' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.courses).toEqual([
      { id: 'c1', name: 'טיפוגרפיה א׳', color: '#E63946', semester: 'ב1' },
    ])
  })

  it('shows only current-semester courses (untagged = א1)', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: 'old', data: () => ({ name: 'טיפוגרפיה א׳' }) },
          { id: 'a1', data: () => ({ name: 'תנועה', semester: 'א1' }) },
          { id: 'b1', data: () => ({ name: 'גריד', semester: 'ב1' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.courses.map(c => c.id)).toEqual(['b1'])
  })

  it('sorts by day, then by start time within a day', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: 'tue-pm', data: () => ({ day: 2, hours: '14:00-17:00', semester: 'ב1' }) },
          { id: 'mon-pm', data: () => ({ day: 1, hours: '14:00-17:00', semester: 'ב1' }) },
          { id: 'tue-am', data: () => ({ day: 2, hours: '10:00-13:00', semester: 'ב1' }) },
          { id: 'mon-am', data: () => ({ day: 1, hours: '10:00-13:00', semester: 'ב1' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCourses())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.courses.map(c => c.id)).toEqual(['mon-am', 'mon-pm', 'tue-am', 'tue-pm'])
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
