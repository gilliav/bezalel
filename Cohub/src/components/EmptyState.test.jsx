import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

it('renders the message', () => {
  render(<EmptyState message="אין פרויקטים פעילים" />)
  expect(screen.getByText('אין פרויקטים פעילים')).toBeInTheDocument()
})
