import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogAuth = vi.hoisted(() => vi.fn())
const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseUserRatingStatus = vi.hoisted(() => vi.fn())
const mockSubmitRating = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const mockMarkNotTaken = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

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
    render(<MemoryRouter initialEntries={['/catalog/rate']}><CatalogRate /></MemoryRouter>)
    expect(screen.getByText('אילו קורסים למדת?')).toBeInTheDocument()
  })

  it('moves to the swipe deck for the checked courses after Done', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/catalog/rate']}><CatalogRate /></MemoryRouter>)

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('אילו קורסים למדת?')).not.toBeInTheDocument()
  })

  it('advances to the next card and calls submitRating after Submit', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/catalog/rate']}><CatalogRate /></MemoryRouter>)

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('checkbox', { name: /זכויות יוצרים/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    await user.click(screen.getByRole('button', { name: 'כן, ממליץ/ה' }))
    await user.click(screen.getByRole('button', { name: 'שליחה והמשך' }))

    expect(mockSubmitRating).toHaveBeenCalledWith(expect.objectContaining({ uid: 'u1', courseCode: 'c1', recommend: true }))
    expect(screen.getByText('זכויות יוצרים')).toBeInTheDocument()
  })

  it('shows a finished message once the deck (from ?start=) is empty', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/catalog/rate?start=c1']}><CatalogRate /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'כן, ממליץ/ה' }))
    await user.click(screen.getByRole('button', { name: 'שליחה והמשך' }))

    expect(screen.getByText(/סיימת לדרג/)).toBeInTheDocument()
  })
})
