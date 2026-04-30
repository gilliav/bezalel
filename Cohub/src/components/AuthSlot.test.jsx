import { render, screen, fireEvent } from '@testing-library/react'
import { AuthSlot } from './AuthSlot'

it('renders nothing when user is undefined (loading)', () => {
  const { container } = render(<AuthSlot user={undefined} signIn={() => {}} signOut={() => {}} />)
  expect(container.firstChild).toBeNull()
})

it('renders sign-in prompt when user is null', () => {
  render(<AuthSlot user={null} signIn={() => {}} signOut={() => {}} />)
  expect(screen.getByRole('button', { name: /התחבר/i })).toBeInTheDocument()
})

it('calls signIn when sign-in button is clicked', () => {
  const signIn = vi.fn()
  render(<AuthSlot user={null} signIn={signIn} signOut={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /התחבר/i }))
  expect(signIn).toHaveBeenCalledOnce()
})

it('renders trigger button with first name when user is signed in', () => {
  const user = { displayName: 'גילי אברך', uid: '1' }
  render(<AuthSlot user={user} signIn={() => {}} signOut={() => {}} />)
  expect(screen.getByRole('button', { name: /גילי/i })).toBeInTheDocument()
})

it('opens menu when trigger is clicked', () => {
  const user = { displayName: 'גילי אברך', uid: '1' }
  render(<AuthSlot user={user} signIn={() => {}} signOut={() => {}} />)
  expect(screen.queryByRole('button', { name: 'התנתק.י' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /גילי/i }))
  expect(screen.getByRole('button', { name: 'התנתק.י' })).toBeInTheDocument()
})

it('calls signOut and closes menu when התנתק.י is clicked', () => {
  const signOut = vi.fn()
  const user = { displayName: 'גילי אברך', uid: '1' }
  render(<AuthSlot user={user} signIn={() => {}} signOut={signOut} />)
  fireEvent.click(screen.getByRole('button', { name: /גילי/i }))
  fireEvent.click(screen.getByRole('button', { name: 'התנתק.י' }))
  expect(signOut).toHaveBeenCalledOnce()
  expect(screen.queryByRole('button', { name: 'התנתק.י' })).not.toBeInTheDocument()
})

it('closes menu when overlay is clicked', () => {
  const user = { displayName: 'גילי אברך', uid: '1' }
  render(<AuthSlot user={user} signIn={() => {}} signOut={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /גילי/i }))
  expect(screen.getByRole('button', { name: 'התנתק.י' })).toBeInTheDocument()
  fireEvent.click(screen.getByTestId('auth-menu-overlay'))
  expect(screen.queryByRole('button', { name: 'התנתק.י' })).not.toBeInTheDocument()
})

it('renders fallback label when displayName is null', () => {
  const user = { displayName: null, email: 'test@example.com', uid: '2' }
  render(<AuthSlot user={user} signIn={() => {}} signOut={() => {}} />)
  expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument()
})

it('closes menu on Escape key', () => {
  const user = { displayName: 'גילי אברך', uid: '1' }
  const { container } = render(<AuthSlot user={user} signIn={() => {}} signOut={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /גילי/i }))
  fireEvent.keyDown(container.firstChild, { key: 'Escape' })
  expect(screen.queryByRole('button', { name: 'התנתק.י' })).not.toBeInTheDocument()
})
