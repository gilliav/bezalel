import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseAllCatalogRatings = vi.hoisted(() => vi.fn())

vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({ useAllCatalogRatings: mockUseAllCatalogRatings }))

import CatalogList from './CatalogList'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני' },
  { id: 'c2', name: 'סכיזואנליזה', lecturer: 'אהד זהבי', category: 'סמינר סמסטריאלי' },
]

describe('CatalogList', () => {
  beforeEach(() => {
    mockUseCatalogCourses.mockReturnValue({ courses, loading: false })
    mockUseAllCatalogRatings.mockReturnValue({ ratings: [], loading: false })
  })

  it('renders all courses when there is no search term', () => {
    render(<MemoryRouter><CatalogList /></MemoryRouter>)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('סכיזואנליזה')).toBeInTheDocument()
  })

  it('filters courses by name as the user types', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><CatalogList /></MemoryRouter>)

    await user.type(screen.getByPlaceholderText('חיפוש לפי שם קורס או מרצה'), 'איור')

    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('סכיזואנליזה')).not.toBeInTheDocument()
  })

  it('shows a loading state while courses are loading', () => {
    mockUseCatalogCourses.mockReturnValue({ courses: [], loading: true })
    render(<MemoryRouter><CatalogList /></MemoryRouter>)
    expect(screen.getByText('טוען...')).toBeInTheDocument()
  })
})
