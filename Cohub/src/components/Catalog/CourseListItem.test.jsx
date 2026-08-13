import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { it, expect } from 'vitest'
import { CourseListItem } from './CourseListItem'

const course = { id: '1700686', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני' }

it('shows course name, lecturer, and category', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
  expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
  expect(screen.getByText('בחירה עיוני')).toBeInTheDocument()
})

it('shows "no ratings yet" when aggregate count is 0', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('אין דירוגים עדיין')).toBeInTheDocument()
})

it('shows recommend percent and rating count when ratings exist', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 12, recommendPercent: 83 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText(/83% ממליצים/)).toBeInTheDocument()
  expect(screen.getByText(/12 דירוגים/)).toBeInTheDocument()
})

it('links to the course detail page', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/catalog/1700686')
})
