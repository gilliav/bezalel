import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectRow } from './ProjectRow'

const course = { id: 'c1', name: 'עיצוב גרפי א׳', color: '#b8ddb0' }

const projectSingle = {
  id: 'p1',
  title: 'פרויקט צילום',
  courseId: 'c1',
  dueDate: { toDate: () => new Date('2099-05-01') },
}

const projectMulti = {
  id: 'p2',
  title: 'פוסטר טיפוגרפי',
  courseId: 'c1',
  dueDate: null,
}

const nextMilestone = { title: 'סקיצות ראשוניות', index: 1, dueDate: { toDate: () => new Date('2099-04-10') } }

function renderRow(project, milestone = null) {
  return render(
    <MemoryRouter>
      <ProjectRow project={project} course={course} nextMilestone={milestone} />
    </MemoryRouter>
  )
}

it('renders project title', () => {
  renderRow(projectSingle)
  expect(screen.getByText('פרויקט צילום')).toBeInTheDocument()
})

it('renders course name', () => {
  renderRow(projectSingle)
  expect(screen.getByText('עיצוב גרפי א׳')).toBeInTheDocument()
})

it('renders milestone with formatted index when nextMilestone provided', () => {
  renderRow(projectMulti, nextMilestone)
  expect(screen.getByText(/01/)).toBeInTheDocument()
  expect(screen.getByText(/סקיצות ראשוניות/)).toBeInTheDocument()
})

it('does not render milestone section when nextMilestone is null', () => {
  renderRow(projectSingle, null)
  expect(screen.queryByText(/›/)).not.toBeInTheDocument()
})

it('links to the project detail page', () => {
  renderRow(projectSingle)
  expect(screen.getByRole('link')).toHaveAttribute('href', '/projects/p1')
})
