import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

it('links to /cohub for project management', () => {
  render(<MemoryRouter><Home /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /Cohub/ })).toHaveAttribute('href', '/cohub')
})

it('links to /catalog for the course catalog', () => {
  render(<MemoryRouter><Home /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /קטלוג קורסים/ })).toHaveAttribute('href', '/catalog')
})
