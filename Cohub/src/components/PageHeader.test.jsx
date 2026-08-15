import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PageHeader } from './PageHeader'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

it('renders the title', () => {
  renderWithRouter(<PageHeader title="הגשות" />)
  expect(screen.getByRole('heading', { name: 'הגשות' })).toBeInTheDocument()
})

it('renders the action slot when provided', () => {
  renderWithRouter(<PageHeader title="הגשות" action={<button>+ חדש</button>} />)
  expect(screen.getByRole('button', { name: '+ חדש' })).toBeInTheDocument()
})

it('renders without action slot', () => {
  const { container } = renderWithRouter(<PageHeader title="מערכת שעות" />)
  expect(container.querySelector('button')).not.toBeInTheDocument()
})

it('renders a back button when hasBackButton is set', () => {
  renderWithRouter(<PageHeader title="קורס" hasBackButton />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})

it('omits the back button by default', () => {
  renderWithRouter(<PageHeader title="קורס" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
