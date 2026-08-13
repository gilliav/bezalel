import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ auth: {}, db: {} }))

const mockOnAuthStateChanged = vi.hoisted(() => vi.fn())
const mockSignInWithPopup = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())
const mockGetDoc = vi.hoisted(() => vi.fn())
const mockSetDoc = vi.hoisted(() => vi.fn())
const mockDoc = vi.hoisted(() => vi.fn())
const mockServerTimestamp = vi.hoisted(() => vi.fn(() => 'ts'))

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
}))

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  serverTimestamp: mockServerTimestamp,
}))

import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'

function Consumer() {
  const { isAdmin, user } = useAuth()
  return (
    <>
      <div data-testid="result">{String(isAdmin)}</div>
      <div data-testid="user">{user === undefined ? 'undefined' : String(user?.uid ?? null)}</div>
    </>
  )
}

describe('AuthContext isAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exposes isAdmin=true when user doc has role admin', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'u1', email: 'a@b.com', displayName: 'Admin' })
      return () => {}
    })
    mockDoc.mockReturnValue('docRef')
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'admin', cohortId: 'c1', courseIds: [] }),
    })

    render(<AuthProvider><Consumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('true'))
  })

  it('exposes isAdmin=false when user doc has no role', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'u2', email: 'b@b.com', displayName: 'Student' })
      return () => {}
    })
    mockDoc.mockReturnValue('docRef')
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ cohortId: 'c1', courseIds: [] }),
    })

    render(<AuthProvider><Consumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('result').textContent).toBe('false'))
  })
})

describe('AuthContext anonymous users', () => {
  beforeEach(() => vi.clearAllMocks())

  it('treats an anonymous user as signed out and never seeds a user doc', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'anon1', isAnonymous: true })
      return () => {}
    })
    mockDoc.mockReturnValue('docRef')

    render(<AuthProvider><Consumer /></AuthProvider>)

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('null'))
    expect(screen.getByTestId('result').textContent).toBe('false')
    expect(mockGetDoc).not.toHaveBeenCalled()
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it('still signs in a real (non-anonymous) user', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, cb) => {
      cb({ uid: 'u3', email: 'c@b.com', displayName: 'Real', isAnonymous: false })
      return () => {}
    })
    mockDoc.mockReturnValue('docRef')
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ cohortId: 'c1', courseIds: [] }),
    })

    render(<AuthProvider><Consumer /></AuthProvider>)

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('u3'))
    expect(mockGetDoc).toHaveBeenCalled()
  })
})
