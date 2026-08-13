import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogAuth = vi.hoisted(() => vi.fn())
const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseAllCatalogRatings = vi.hoisted(() => vi.fn())

vi.mock('../hooks/useCatalogAuth', () => ({ useCatalogAuth: mockUseCatalogAuth }))
vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({ useAllCatalogRatings: mockUseAllCatalogRatings }))

import CatalogList from './CatalogList'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני' },
  { id: 'c2', name: 'סכיזואנליזה', lecturer: 'אהד זהבי', category: 'סמינר סמסטריאלי' },
]

describe('CatalogList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCatalogAuth.mockReturnValue({ uid: 'u1', ready: true, error: null })
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

  it('waits for anonymous auth before rendering courses', () => {
    mockUseCatalogAuth.mockReturnValue({ uid: null, ready: false, error: null })
    render(<MemoryRouter><CatalogList /></MemoryRouter>)

    expect(screen.getByText('טוען...')).toBeInTheDocument()
    expect(screen.queryByText('תולדות האיור')).not.toBeInTheDocument()
    expect(screen.queryByText('לא נמצאו קורסים')).not.toBeInTheDocument()
  })

  it('reports a sign-in failure through onError', async () => {
    mockUseCatalogAuth.mockReturnValue({ uid: null, ready: false, error: new Error('nope') })
    const onError = vi.fn()
    render(<MemoryRouter><CatalogList onError={onError} /></MemoryRouter>)

    await waitFor(() => expect(onError).toHaveBeenCalledWith('שגיאה בהתחברות'))
  })

  it('reports a catalog load failure through onError', async () => {
    mockUseCatalogCourses.mockReturnValue({ courses: [], loading: false, error: new Error('denied') })
    const onError = vi.fn()
    render(<MemoryRouter><CatalogList onError={onError} /></MemoryRouter>)

    await waitFor(() => expect(onError).toHaveBeenCalledWith('שגיאה בטעינת הקטלוג'))
  })
})
