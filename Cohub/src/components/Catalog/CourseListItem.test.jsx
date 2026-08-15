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

it('shows a dash placeholder when aggregate count is 0', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('--')).toBeInTheDocument()
})

it('shows recommend percent and rating count when ratings exist', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 12, recommendPercent: 83, profGood: null }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('83%')).toBeInTheDocument()
  expect(screen.getByText(/12 דירוגים/)).toBeInTheDocument()
})

it('shows the profGood star stat when it has data', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 12, recommendPercent: 83, profGood: 4.2 }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('4.2')).toBeInTheDocument()
})

it('omits the profGood star stat when nobody has rated it', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 12, recommendPercent: 83, profGood: null }} />
    </MemoryRouter>,
  )
  expect(screen.queryByText('4.2')).not.toBeInTheDocument()
})

it('links to the course detail page', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0 }} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/catalog/1700686')
})
