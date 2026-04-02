import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MilestoneItem } from './MilestoneItem'

const future = { toDate: () => new Date('2099-06-01') }
const past = { toDate: () => new Date('2020-01-01') }

function renderItem(dueDate) {
  const milestone = {
    id: 'm1',
    title: 'הגשת טיוטה',
    dueDate,
    projectId: 'p1',
    courseId: 'c1',
    projectTitle: 'פוסטר טיפוגרפי',
  }
  const course = { id: 'c1', name: 'טיפוגרפיה א׳', color: '#E63946' }
  return render(
    <MemoryRouter>
      <MilestoneItem milestone={milestone} course={course} />
    </MemoryRouter>,
  )
}

it('displays milestone title, project title, and course name', () => {
  renderItem(future)
  expect(screen.getByText('הגשת טיוטה')).toBeInTheDocument()
  expect(screen.getByText('פוסטר טיפוגרפי')).toBeInTheDocument()
  expect(screen.getByText('טיפוגרפיה א׳')).toBeInTheDocument()
})

it('marks overdue milestones with data-overdue attribute', () => {
  const { container } = renderItem(past)
  expect(container.firstChild).toHaveAttribute('data-overdue', 'true')
})

it('does not mark future milestones as overdue', () => {
  const { container } = renderItem(future)
  expect(container.firstChild).not.toHaveAttribute('data-overdue', 'true')
})

it('links to the parent project', () => {
  renderItem(future)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/p1')
})
