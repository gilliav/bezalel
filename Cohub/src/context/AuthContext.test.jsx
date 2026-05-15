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
  return <div data-testid="result">{String(isAdmin)}</div>
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
