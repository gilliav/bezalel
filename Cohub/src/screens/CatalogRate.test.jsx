import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogAuth = vi.hoisted(() => vi.fn())
const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseUserRatingStatus = vi.hoisted(() => vi.fn())
const mockSubmitRating = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMarkNotTaken = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../hooks/useCatalogAuth', () => ({ useCatalogAuth: mockUseCatalogAuth }))
vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({
  useUserRatingStatus: mockUseUserRatingStatus,
  submitRating: mockSubmitRating,
  markNotTaken: mockMarkNotTaken,
}))

import CatalogRate from './CatalogRate'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני', description: 'תיאור' },
  { id: 'c2', name: 'זכויות יוצרים', lecturer: 'איל פרייס', category: 'בחירה עיוני', description: 'תיאור' },
]

// The recommend and attendance fields both render a "חיובי"/"שלילי" thumbs
// toggle, so queries must be scoped to the recommend field's own container.
function getRecommendButton(name) {
  const field = screen.getByText('האם תמליץ/י על הקורס?').closest('.field')
  return within(field).getByRole('button', { name })
}

function renderRate(entry, props = {}) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/catalog/rate" element={<CatalogRate {...props} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogRate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCatalogAuth.mockReturnValue({ uid: 'u1', ready: true })
    mockUseCatalogCourses.mockReturnValue({ courses, loading: false })
    mockUseUserRatingStatus.mockReturnValue({
      ratedCodes: new Set(),
      notTakenCodes: new Set(),
      loading: false,
    })
  })

  it('shows the checklist first', () => {
    renderRate('/catalog/rate')
    expect(screen.getByText('אילו קורסים למדת?')).toBeInTheDocument()
  })

  it('moves to the swipe deck for the checked courses after Done', async () => {
    const user = userEvent.setup()
    renderRate('/catalog/rate')

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('אילו קורסים למדת?')).not.toBeInTheDocument()
  })

  it('advances to the next card and calls submitRating after Submit', async () => {
    const user = userEvent.setup()
    renderRate('/catalog/rate')

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('checkbox', { name: /זכויות יוצרים/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    await user.click(getRecommendButton('חיובי'))
    await user.click(screen.getByRole('button', { name: 'אישור' }))

    expect(mockSubmitRating).toHaveBeenCalledWith(expect.objectContaining({ uid: 'u1', courseCode: 'c1', recommend: true }))
    expect(screen.getByText('זכויות יוצרים')).toBeInTheDocument()
  })

  it('navigates back to /catalog once the deck is empty', async () => {
    const user = userEvent.setup()
    renderRate('/catalog/rate')

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    await user.click(getRecommendButton('חיובי'))
    await user.click(screen.getByRole('button', { name: 'אישור' }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/catalog'))
  })

  it('drops only one course when Submit is double-tapped during the pending write', async () => {
    const user = userEvent.setup()
    // Every pending write gets its own resolver; we release them all so both
    // in-flight handlers reach their setQueue call.
    const resolvers = []
    mockSubmitRating.mockImplementation(() => new Promise(res => resolvers.push(res)))

    renderRate('/catalog/rate')

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('checkbox', { name: /זכויות יוצרים/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))
    await user.click(getRecommendButton('חיובי'))

    // Two taps land before the awaited write resolves, so both handlers
    // capture the same queue[0].
    const submit = screen.getByRole('button', { name: 'אישור' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(resolvers).toHaveLength(2)
    await act(async () => { resolvers.forEach(r => r()) })

    expect(mockSubmitRating).toHaveBeenCalledTimes(2)
    expect(mockSubmitRating).toHaveBeenCalledWith(expect.objectContaining({ courseCode: 'c1' }))
    // c2 must survive: the dequeue is idempotent, not a blind slice(1).
    expect(screen.getByText('זכויות יוצרים')).toBeInTheDocument()
    expect(screen.queryByText(/סיימת לדרג/)).not.toBeInTheDocument()
  })

  it('navigates to /catalog when ביטול is clicked', async () => {
    const user = userEvent.setup()
    renderRate('/catalog/rate')

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    await user.click(screen.getByRole('button', { name: 'ביטול' }))

    expect(mockNavigate).toHaveBeenCalledWith('/catalog')
  })
})
