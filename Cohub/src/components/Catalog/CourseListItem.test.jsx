import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { it, expect } from 'vitest'
import { CourseListItem } from './CourseListItem'

const course = { id: '1700686', name: 'תולדות האיור', lecturer: 'אורנה גרנות', category: 'בחירה עיוני' }

it('shows course name and lecturer', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0, recommendPercent: null, profGood: null }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
  expect(screen.getByText('אורנה גרנות')).toBeInTheDocument()
})

it('shows dash placeholders and 0 ratings when there is no data', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0, recommendPercent: null, profGood: null }} />
    </MemoryRouter>,
  )
  expect(screen.getAllByText('--')).toHaveLength(2)
  expect(screen.getByText(/0 דירוגים/)).toBeInTheDocument()
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

it('shows a dash for the star stat when nobody has answered profGood', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 12, recommendPercent: 83, profGood: null }} />
    </MemoryRouter>,
  )
  expect(screen.getByText('--')).toBeInTheDocument()
})

it('links to the course detail page', () => {
  render(
    <MemoryRouter>
      <CourseListItem course={course} aggregate={{ count: 0, recommendPercent: null, profGood: null }} />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/catalog/1700686')
})
