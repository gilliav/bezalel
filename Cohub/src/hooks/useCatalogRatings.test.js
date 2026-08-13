import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockUnsubscribe = vi.hoisted(() => vi.fn())
const mockOnSnapshot = vi.hoisted(() => vi.fn())
const mockQuery = vi.hoisted(() => vi.fn((...args) => ({ __query: args })))
const mockWhere = vi.hoisted(() => vi.fn((...args) => ({ __where: args })))
const mockSetDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockDoc = vi.hoisted(() => vi.fn((...args) => ({ __doc: args })))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((...args) => ({ __collection: args })),
  query: mockQuery,
  where: mockWhere,
  onSnapshot: mockOnSnapshot,
  doc: mockDoc,
  setDoc: mockSetDoc,
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}))

import {
  useAllCatalogRatings,
  useCourseRatings,
  useUserRatingStatus,
  submitRating,
  markNotTaken,
} from './useCatalogRatings'

describe('useAllCatalogRatings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns every rating doc unfiltered', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({ docs: [{ id: 'u1_c1', data: () => ({ courseCode: 'c1', uid: 'u1', status: 'rated' }) }] })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useAllCatalogRatings())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.ratings).toEqual([
      { id: 'u1_c1', courseCode: 'c1', uid: 'u1', status: 'rated' },
    ])
  })
})

describe('useCourseRatings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries filtered by courseCode', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({ docs: [] })
      return mockUnsubscribe
    })

    renderHook(() => useCourseRatings('c1'))

    await waitFor(() => expect(mockWhere).toHaveBeenCalledWith('courseCode', '==', 'c1'))
  })
})

describe('useUserRatingStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('splits ratings into ratedCodes and notTakenCodes sets', async () => {
    mockOnSnapshot.mockImplementation((q, onNext) => {
      onNext({
        docs: [
          { id: 'd1', data: () => ({ courseCode: 'c1', status: 'rated' }) },
          { id: 'd2', data: () => ({ courseCode: 'c2', status: 'notTaken' }) },
        ],
      })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useUserRatingStatus('u1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.ratedCodes).toEqual(new Set(['c1']))
    expect(result.current.notTakenCodes).toEqual(new Set(['c2']))
  })
})

describe('submitRating', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes a rated doc at the uid_courseCode doc id', async () => {
    await submitRating({
      uid: 'u1',
      courseCode: 'c1',
      recommend: true,
      profGood: 4,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTaken: null,
      comment: '',
    })

    expect(mockDoc).toHaveBeenCalledWith({}, 'catalogRatings', 'u1_c1')
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'rated', recommend: true, profGood: 4, courseCode: 'c1', uid: 'u1' }),
    )
  })
})

describe('markNotTaken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes a notTaken doc at the uid_courseCode doc id', async () => {
    await markNotTaken({ uid: 'u1', courseCode: 'c1' })

    expect(mockDoc).toHaveBeenCalledWith({}, 'catalogRatings', 'u1_c1')
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'notTaken', courseCode: 'c1', uid: 'u1' }),
    )
  })
})
