import { render, screen } from '@testing-library/react'
import { UrgencyPill } from './UrgencyPill'

it('renders the label text', () => {
  render(<UrgencyPill label="מחר" variant="dark" />)
  expect(screen.getByText('מחר')).toBeInTheDocument()
})

it('applies pill-dark class for dark variant', () => {
  const { container } = render(<UrgencyPill label="מחר" variant="dark" />)
  expect(container.firstChild).toHaveClass('pill-dark')
})

it('applies pill-muted class for muted variant', () => {
  const { container } = render(<UrgencyPill label="בעוד חודש" variant="muted" />)
  expect(container.firstChild).toHaveClass('pill-muted')
})

it('applies pill-danger class for danger variant', () => {
  const { container } = render(<UrgencyPill label="עבר הדדליין" variant="danger" />)
  expect(container.firstChild).toHaveClass('pill-danger')
})
