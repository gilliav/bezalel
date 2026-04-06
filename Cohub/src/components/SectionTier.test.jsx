import { render, screen } from '@testing-library/react'
import { SectionTier } from './SectionTier'

it('renders the label text', () => {
  render(<SectionTier label="השבוע" variant="hot" />)
  expect(screen.getByText('השבוע')).toBeInTheDocument()
})

it('applies tier-label-hot class for hot variant', () => {
  render(<SectionTier label="השבוע" variant="hot" />)
  expect(screen.getByText('השבוע')).toHaveClass('tier-label-hot')
})

it('applies tier-label class for normal variant', () => {
  render(<SectionTier label="בהמשך" variant="normal" />)
  expect(screen.getByText('בהמשך')).toHaveClass('tier-label')
})

it('renders the hairline element', () => {
  const { container } = render(<SectionTier label="בהמשך" variant="normal" />)
  expect(container.querySelector('.tier-line')).toBeInTheDocument()
})
