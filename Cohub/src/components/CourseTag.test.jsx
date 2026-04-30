import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CourseTag } from './CourseTag'

it('renders the course name', () => {
  render(<CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" />)
  expect(screen.getByText('עיצוב גרפי א׳')).toBeInTheDocument()
})

it('applies border-bottom in course color via inline style', () => {
  const { container } = render(<CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" />)
  expect(container.firstChild).toHaveStyle('border-bottom: 1.5px solid #b8ddb0')
})

it('renders a link when to prop is provided', () => {
  render(
    <MemoryRouter>
      <CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" to="/courses/c1" />
    </MemoryRouter>
  )
  expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/c1')
})

it('renders a span (not a link) when to prop is omitted', () => {
  const { container } = render(<CourseTag name="עיצוב גרפי א׳" color="#b8ddb0" />)
  expect(container.firstChild.tagName).toBe('SPAN')
})
