import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'

it('renders the title', () => {
  render(<PageHeader title="הגשות" />)
  expect(screen.getByRole('heading', { name: 'הגשות' })).toBeInTheDocument()
})

it('renders the action slot when provided', () => {
  render(<PageHeader title="הגשות" action={<button>+ חדש</button>} />)
  expect(screen.getByRole('button', { name: '+ חדש' })).toBeInTheDocument()
})

it('renders without action slot', () => {
  const { container } = render(<PageHeader title="מערכת שעות" />)
  expect(container.querySelector('button')).not.toBeInTheDocument()
})
