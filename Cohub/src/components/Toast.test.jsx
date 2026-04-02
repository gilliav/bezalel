import { render, screen } from '@testing-library/react'
import { Toast } from './Toast'

it('displays the error message', () => {
  render(<Toast message="שגיאה בטעינת הנתונים" />)
  expect(screen.getByText('שגיאה בטעינת הנתונים')).toBeInTheDocument()
})

it('renders nothing when message is null', () => {
  const { container } = render(<Toast message={null} />)
  expect(container.firstChild).toBeNull()
})
