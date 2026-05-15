import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
}))

const mockUseCourses = vi.hoisted(() => vi.fn())
vi.mock('../hooks/useCourses', () => ({ useCourses: mockUseCourses }))

import Schedule from './Schedule'

const regularCourse = {
  id: 'c1',
  name: 'טיפוגרפיה',
  day: 'שני',
  hours: '10:00-13:00',
  lecturer: 'כהן משה',
  location: 'סטודיו 135',
  color: '#E63946',
  isOnline: false,
}

const onlineCourse = {
  id: 'c2',
  name: 'עיצוב אונליין',
  lecturer: 'לוי שרה',
  color: '#457B9D',
  isOnline: true,
}

describe('Schedule screen', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders regular courses under their day section', () => {
    mockUseCourses.mockReturnValue({ courses: [regularCourse], loading: false })
    render(<MemoryRouter><Schedule /></MemoryRouter>)
    expect(screen.getByText('טיפוגרפיה')).toBeInTheDocument()
  })

  it('renders online courses under אונליין section', () => {
    mockUseCourses.mockReturnValue({ courses: [onlineCourse], loading: false })
    render(<MemoryRouter><Schedule /></MemoryRouter>)
    expect(screen.getByText('עיצוב אונליין')).toBeInTheDocument()
  })

  it('does not render אונליין section when no online courses', () => {
    mockUseCourses.mockReturnValue({ courses: [regularCourse], loading: false })
    render(<MemoryRouter><Schedule /></MemoryRouter>)
    expect(screen.queryByText('אונליין')).not.toBeInTheDocument()
  })

  it('shows קורס מקוון tag and lecturer in online section', () => {
    mockUseCourses.mockReturnValue({ courses: [onlineCourse], loading: false })
    render(<MemoryRouter><Schedule /></MemoryRouter>)
    expect(screen.getByText('קורס מקוון')).toBeInTheDocument()
    expect(screen.getByText('לוי שרה')).toBeInTheDocument()
  })
})
