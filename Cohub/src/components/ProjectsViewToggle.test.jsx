import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProjectsViewToggle } from './ProjectsViewToggle'

it('links to the list and calendar views', () => {
  render(<MemoryRouter><ProjectsViewToggle /></MemoryRouter>)
  expect(screen.getByText('רשימה').closest('a')).toHaveAttribute('href', '/cohub')
  expect(screen.getByText('לוח שנה').closest('a')).toHaveAttribute('href', '/cohub/calendar')
})

it('marks only the calendar view active on /cohub/calendar', () => {
  render(
    <MemoryRouter initialEntries={['/cohub/calendar']}>
      <ProjectsViewToggle />
    </MemoryRouter>,
  )
  expect(screen.getByText('לוח שנה').closest('a')).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText('רשימה').closest('a')).not.toHaveAttribute('aria-current')
})
