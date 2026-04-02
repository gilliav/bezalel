import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Timeline } from './Timeline'

const future = { toDate: () => new Date('2099-06-01') }
const past = { toDate: () => new Date('2020-01-01') }

const projects = [
  { id: 'p1', title: 'פוסטר', courseId: 'c1' },
  { id: 'p2', title: 'אנימציה', courseId: 'c1' },
]

const milestones = [
  { id: 'm1', title: 'טיוטה', dueDate: past, projectId: 'p1', courseId: 'c1', projectTitle: 'פוסטר' },
  { id: 'm2', title: 'הגשה', dueDate: future, projectId: 'p2', courseId: 'c1', projectTitle: 'אנימציה' },
]

it('renders all projects as numbered items', () => {
  render(
    <MemoryRouter>
      <Timeline projects={projects} milestones={milestones} />
    </MemoryRouter>,
  )
  expect(screen.getByText('פוסטר')).toBeInTheDocument()
  expect(screen.getByText('אנימציה')).toBeInTheDocument()
})

it('expands the project with the nearest future milestone by default', () => {
  render(
    <MemoryRouter>
      <Timeline projects={projects} milestones={milestones} />
    </MemoryRouter>,
  )
  // p2 has the future milestone — its milestones should be visible
  expect(screen.getByText('הגשה')).toBeInTheDocument()
  // p1's past milestone should not be visible (collapsed)
  expect(screen.queryByText('טיוטה')).not.toBeInTheDocument()
})

it('toggles expansion when a project is tapped', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <Timeline projects={projects} milestones={milestones} />
    </MemoryRouter>,
  )
  await user.click(screen.getByText('פוסטר'))
  expect(screen.getByText('טיוטה')).toBeInTheDocument()
})
