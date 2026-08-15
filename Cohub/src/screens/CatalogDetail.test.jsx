import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogAuth = vi.hoisted(() => vi.fn())
const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseCourseRatings = vi.hoisted(() => vi.fn())
const mockSubmitRating = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../hooks/useCatalogAuth', () => ({ useCatalogAuth: mockUseCatalogAuth }))
vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({
  useCourseRatings: mockUseCourseRatings,
  submitRating: mockSubmitRating,
}))

import CatalogDetail from './CatalogDetail'

const course = {
  id: 'c1',
  name: 'תולדות האיור',
  lecturer: 'אורנה גרנות',
  category: 'בחירה עיוני',
  semester: 'א',
  day: 'ראשון',
  hours: '11:00-09:30',
  credits: { weeklyHours: 2, points: 2 },
  description: 'איורים הם יצירות האמנות הראשונות שאנו מכירים.',
}

function renderDetail(props = {}, entry = '/catalog/c1') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/catalog/:courseId" element={<CatalogDetail {...props} />} />
        <Route path="/catalog/:courseId/rate" element={<CatalogDetail {...props} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCatalogAuth.mockReturnValue({ uid: 'u1', ready: true, error: null })
    mockUseCatalogCourses.mockReturnValue({ courses: [course], loading: false })
    mockUseCourseRatings.mockReturnValue({ ratings: [], loading: false })
  })

  it('shows course name, lecturer, and description', () => {
    renderDetail()
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
    expect(screen.getByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).toBeInTheDocument()
  })

  it('prompts to be the first rater instead of showing a stat breakdown when there are no ratings', () => {
    renderDetail()
    expect(screen.getByText('אין דירוגים עדיין')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'תוסיפ.י דירוג כאן' })).toHaveAttribute('href', '/catalog/c1/rate')
    expect(screen.queryByText(/איכות ההוראה/)).not.toBeInTheDocument()
  })

  it('shows aggregate stats and written comments when ratings exist', () => {
    mockUseCourseRatings.mockReturnValue({
      ratings: [
        { id: 'r1', status: 'rated', recommend: true, profGood: 5, comment: 'קורס מעולה' },
      ],
      loading: false,
    })
    renderDetail()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText(/ממליצים · 1 דירוגים/)).toBeInTheDocument()
    expect(screen.getByText('5.0')).toBeInTheDocument()
    expect(screen.getByText('קורס מעולה')).toBeInTheDocument()
  })

  it('shows the literal attendance label with the raw percent in parentheses', () => {
    mockUseCourseRatings.mockReturnValue({
      ratings: [
        { id: 'r1', status: 'rated', recommend: true, attendanceTaken: true },
        { id: 'r2', status: 'rated', recommend: true, attendanceTaken: true },
        { id: 'r3', status: 'rated', recommend: true, attendanceTaken: false },
      ],
      loading: false,
    })
    renderDetail()
    // 2/3 = 67% → lands in the 20-80 "unclear" band
    expect(screen.getByText('לא ברור')).toBeInTheDocument()
    expect(screen.getByText('(67%)')).toBeInTheDocument()
  })

  it('waits for anonymous auth before rendering the course', () => {
    mockUseCatalogAuth.mockReturnValue({ uid: null, ready: false, error: null })
    renderDetail()

    expect(screen.getByText('טוען...')).toBeInTheDocument()
    expect(screen.queryByText('אורנה גרנות')).not.toBeInTheDocument()
  })

  it('reports a sign-in failure through onError', async () => {
    mockUseCatalogAuth.mockReturnValue({ uid: null, ready: false, error: new Error('nope') })
    const onError = vi.fn()
    renderDetail({ onError })

    await waitFor(() => expect(onError).toHaveBeenCalledWith('שגיאה בהתחברות'))
  })

  it('reports a course load failure through onError', async () => {
    mockUseCourseRatings.mockReturnValue({ ratings: [], loading: false, error: new Error('denied') })
    const onError = vi.fn()
    renderDetail({ onError })

    await waitFor(() => expect(onError).toHaveBeenCalledWith('שגיאה בטעינת הקורס'))
  })

  it('omits the semester segment when the course has no semester', () => {
    mockUseCatalogCourses.mockReturnValue({
      courses: [{ ...course, semester: undefined }],
      loading: false,
    })
    renderDetail()

    expect(screen.queryByText(/סמסטר undefined/)).not.toBeInTheDocument()
    expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
  })

  it('renders without crashing when the course has no credits', () => {
    mockUseCatalogCourses.mockReturnValue({
      courses: [{ ...course, credits: undefined }],
      loading: false,
    })
    renderDetail()

    expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
    expect(screen.queryByText(/ש"ס/)).not.toBeInTheDocument()
  })

  it('shows a reviews list with every rating, comment or not', () => {
    mockUseCourseRatings.mockReturnValue({
      ratings: [
        { id: 'r1', status: 'rated', recommend: true, profGood: 5, comment: 'קורס מעולה' },
        { id: 'r2', status: 'rated', recommend: false, profGood: 2 },
      ],
      loading: false,
    })
    renderDetail()

    expect(screen.getByText('קורס מעולה')).toBeInTheDocument()
    expect(screen.getByTestId('review-r1')).toBeInTheDocument()
    expect(screen.getByTestId('review-r2')).toBeInTheDocument()
  })

  it('shows the rate button instead of the swipe form when not at the /rate url', () => {
    renderDetail()
    expect(screen.getByRole('link', { name: 'דרג/י את הקורס' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'אישור' })).not.toBeInTheDocument()
  })

  it('renders the rating form inline at /catalog/:courseId/rate', () => {
    renderDetail({}, '/catalog/c1/rate')
    expect(screen.getByRole('button', { name: 'אישור' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ביטול' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'דרג/י את הקורס' })).not.toBeInTheDocument()
  })

  it('submits the rating and navigates back to the course on success', async () => {
    const user = userEvent.setup()
    renderDetail({}, '/catalog/c1/rate')

    const recommendField = screen.getByText('האם תמליץ/י על הקורס?').closest('.field')
    await user.click(within(recommendField).getByRole('button', { name: 'חיובי' }))
    await user.click(screen.getByRole('button', { name: 'אישור' }))

    await waitFor(() =>
      expect(mockSubmitRating).toHaveBeenCalledWith(expect.objectContaining({ uid: 'u1', courseCode: 'c1', recommend: true })),
    )
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/catalog/c1'))
  })

  it('reports a failed submit through onError', async () => {
    mockSubmitRating.mockRejectedValueOnce(new Error('nope'))
    const onError = vi.fn()
    const user = userEvent.setup()
    renderDetail({ onError }, '/catalog/c1/rate')

    const recommendField = screen.getByText('האם תמליץ/י על הקורס?').closest('.field')
    await user.click(within(recommendField).getByRole('button', { name: 'חיובי' }))
    await user.click(screen.getByRole('button', { name: 'אישור' }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith('שגיאה בשמירת הדירוג'))
  })

  it('navigates back to the course when ביטול is clicked', async () => {
    const user = userEvent.setup()
    renderDetail({}, '/catalog/c1/rate')

    await user.click(screen.getByRole('button', { name: 'ביטול' }))

    expect(mockNavigate).toHaveBeenCalledWith('/catalog/c1')
  })
})
