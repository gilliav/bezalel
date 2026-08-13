import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ auth: {} }))

const mockOnAuthStateChanged = vi.hoisted(() => vi.fn())
const mockSignInAnonymously = vi.hoisted(() => vi.fn())
const mockUnsubscribe = vi.hoisted(() => vi.fn())

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  signInAnonymously: mockSignInAnonymously,
}))

import { useCatalogAuth } from './useCatalogAuth'

describe('useCatalogAuth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('signs in anonymously when nobody is signed in', async () => {
    mockSignInAnonymously.mockResolvedValue({})
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return mockUnsubscribe
    })

    renderHook(() => useCatalogAuth())

    await waitFor(() => expect(mockSignInAnonymously).toHaveBeenCalled())
  })

  it('does not sign in again when a user is already active', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: 'existing-uid' })
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogAuth())

    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.uid).toBe('existing-uid')
    expect(mockSignInAnonymously).not.toHaveBeenCalled()
  })

  it('exposes an error when anonymous sign-in fails', async () => {
    const failure = new Error('auth/operation-not-allowed')
    mockSignInAnonymously.mockRejectedValue(failure)
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return mockUnsubscribe
    })

    const { result } = renderHook(() => useCatalogAuth())

    await waitFor(() => expect(result.current.error).toBe(failure))
    expect(result.current.ready).toBe(false)
    expect(result.current.uid).toBe(null)
  })
})
