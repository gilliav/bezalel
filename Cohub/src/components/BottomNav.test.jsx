import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

it('renders three navigation tabs', () => {
  renderWithRouter(<BottomNav />)
  expect(screen.getByText('פרויקטים')).toBeInTheDocument()
  expect(screen.getByText('קורסים')).toBeInTheDocument()
  expect(screen.getByText('לוח זמנים')).toBeInTheDocument()
})

it('highlights the active tab based on current route', () => {
  render(
    <MemoryRouter initialEntries={['/courses']}>
      <BottomNav />
    </MemoryRouter>,
  )
  const coursesTab = screen.getByText('קורסים').closest('a')
  expect(coursesTab).toHaveAttribute('aria-current', 'page')
})
