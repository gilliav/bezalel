import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
}))
vi.mock('../utils/colors', () => ({
  getCourseColor: vi.fn(() => '#E63946'),
  COURSE_COLORS: ['#E63946', '#457B9D'],
}))

const mockUseAuth = vi.hoisted(() => vi.fn())
vi.mock('../hooks/useAuth', () => ({ useAuth: mockUseAuth }))

const mockUseCourses = vi.hoisted(() => vi.fn())
vi.mock('../hooks/useCourses', () => ({ useCourses: mockUseCourses }))

import CoursesList from './CoursesList'

function renderCoursesList(isAdmin = false) {
  mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, isAdmin })
  mockUseCourses.mockReturnValue({ courses: [], loading: false, error: null })
  return render(
    <MemoryRouter>
      <CoursesList onError={() => {}} />
    </MemoryRouter>
  )
}

describe('CoursesList admin button', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does NOT show add button for non-admin', () => {
    renderCoursesList(false)
    expect(screen.queryByRole('button', { name: /קורס חדש/i })).not.toBeInTheDocument()
  })

  it('shows add button for admin', () => {
    renderCoursesList(true)
    expect(screen.getByRole('button', { name: /קורס חדש/i })).toBeInTheDocument()
  })

  it('shows AddCourseForm when add button is clicked', () => {
    renderCoursesList(true)
    fireEvent.click(screen.getByRole('button', { name: /קורס חדש/i }))
    expect(screen.getByLabelText('שם הקורס')).toBeInTheDocument()
  })

  it('hides AddCourseForm when cancel is clicked', () => {
    renderCoursesList(true)
    fireEvent.click(screen.getByRole('button', { name: /קורס חדש/i }))
    expect(screen.getByLabelText('שם הקורס')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /ביטול/i }))
    expect(screen.queryByLabelText('שם הקורס')).not.toBeInTheDocument()
  })
})
