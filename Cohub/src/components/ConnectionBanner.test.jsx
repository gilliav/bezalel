
import { render, screen } from '@testing-library/react'
import { ConnectionBanner } from './ConnectionBanner'

it('shows the offline banner when offline', () => {
  render(<ConnectionBanner isOnline={false} />)
  expect(screen.getByText(/אין חיבור לאינטרנט/)).toBeInTheDocument()
})

it('renders nothing when online', () => {
  const { container } = render(<ConnectionBanner isOnline={true} />)
  expect(container.firstChild).toBeNull()
})
