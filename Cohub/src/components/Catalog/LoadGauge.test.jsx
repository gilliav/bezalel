import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { it, expect, vi } from 'vitest'
import { LoadGauge } from './LoadGauge'

it('renders the light and heavy anchor labels', () => {
  render(<LoadGauge label="עומס העבודה" value={null} onChange={vi.fn()} heavyLabel="כבד" />)
  expect(screen.getByText('קל')).toBeInTheDocument()
  expect(screen.getByText('כבד')).toBeInTheDocument()
})

it('defaults the heavy label to כבד when not provided', () => {
  render(<LoadGauge label="עומס העבודה" value={null} onChange={vi.fn()} />)
  expect(screen.getByText('כבד')).toBeInTheDocument()
})

it('calls onChange with the tapped segment value', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<LoadGauge label="עומס העבודה" value={null} onChange={onChange} />)
  await user.click(screen.getByRole('button', { name: 'עומס העבודה: 4' }))
  expect(onChange).toHaveBeenCalledWith(4)
})

it('toggles off when tapping the already-selected segment', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<LoadGauge label="עומס העבודה" value={4} onChange={onChange} />)
  await user.click(screen.getByRole('button', { name: 'עומס העבודה: 4' }))
  expect(onChange).toHaveBeenCalledWith(null)
})
