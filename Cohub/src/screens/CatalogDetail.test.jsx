import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockUseCatalogCourses = vi.hoisted(() => vi.fn())
const mockUseCourseRatings = vi.hoisted(() => vi.fn())

vi.mock('../hooks/useCatalogCourses', () => ({ useCatalogCourses: mockUseCatalogCourses }))
vi.mock('../hooks/useCatalogRatings', () => ({ useCourseRatings: mockUseCourseRatings }))

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

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/catalog/c1']}>
      <Routes>
        <Route path="/catalog/:courseId" element={<CatalogDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogDetail', () => {
  beforeEach(() => {
    mockUseCatalogCourses.mockReturnValue({ courses: [course], loading: false })
    mockUseCourseRatings.mockReturnValue({ ratings: [], loading: false })
  })

  it('shows course name, lecturer, and description', () => {
    renderDetail()
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
    expect(screen.getByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).toBeInTheDocument()
  })

  it('shows "no ratings yet" when there are none', () => {
    renderDetail()
    expect(screen.getByText('אין דירוגים עדיין')).toBeInTheDocument()
  })

  it('shows aggregate stats and written comments when ratings exist', () => {
    mockUseCourseRatings.mockReturnValue({
      ratings: [
        { id: 'r1', status: 'rated', recommend: true, profGood: 5, comment: 'קורס מעולה' },
      ],
      loading: false,
    })
    renderDetail()
    expect(screen.getByText(/100% ממליצים/)).toBeInTheDocument()
    expect(screen.getByText('קורס מעולה')).toBeInTheDocument()
  })
})
