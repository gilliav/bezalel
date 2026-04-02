import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockOnSnapshot = vi.hoisted(() => vi.fn())
vi.mock('firebase/firestore', () => ({
  collectionGroup: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: mockOnSnapshot,
}))

import { useMilestones } from './useMilestones'

// Minimal Timestamp-like object for tests
const makeTimestamp = (date) => ({ toDate: () => new Date(date) })

describe('useMilestones', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns milestones sorted by dueDate from collectionGroup snapshot', async () => {
    const ts = makeTimestamp('2026-05-01')
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          {
            id: 'm1',
            data: () => ({
              title: 'הגשת טיוטה',
              dueDate: ts,
              projectId: 'p1',
              courseId: 'c1',
              projectTitle: 'פוסטר',
            }),
          },
        ],
      })
      return vi.fn()
    })

    const { result } = renderHook(() => useMilestones())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.milestones[0].title).toBe('הגשת טיוטה')
    expect(result.current.milestones[0].courseId).toBe('c1')
  })
})
