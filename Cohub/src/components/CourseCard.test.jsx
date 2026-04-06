import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { CourseCard } from './CourseCard'

const course = {
  id: 'c1',
  name: 'טיפוגרפיה א׳',
  day: 1,
  hours: '10:00-13:00',
  lecturer: 'חופשי יהודה',
  location: 'סטודיו 135',
  courseUrl: 'https://drive.google.com/example',
  notes: '',
  color: '#E63946',
}

it('displays course name, day, and hours', () => {
  render(<MemoryRouter><CourseCard course={course} onSave={vi.fn()} /></MemoryRouter>)
  expect(screen.getByText('טיפוגרפיה א׳')).toBeInTheDocument()
  expect(screen.getByText(/שני/)).toBeInTheDocument()
  expect(screen.getByText(/10:00-13:00/)).toBeInTheDocument()
})

it('renders a link when courseUrl is set', () => {
  render(<MemoryRouter><CourseCard course={course} onSave={vi.fn()} /></MemoryRouter>)
  expect(screen.getByRole('link', { name: /קישור/ })).toHaveAttribute(
    'href',
    'https://drive.google.com/example',
  )
})

it('calls onSave with updated fields when edit form is submitted', async () => {
  const user = userEvent.setup()
  const onSave = vi.fn()
  render(<MemoryRouter><CourseCard course={course} onSave={onSave} /></MemoryRouter>)

  await user.click(screen.getByRole('button', { name: /עריכה/ }))
  const urlInput = screen.getByDisplayValue('https://drive.google.com/example')
  await user.clear(urlInput)
  await user.type(urlInput, 'https://miro.com/board')
  await user.click(screen.getByRole('button', { name: /שמור/ }))

  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ courseUrl: 'https://miro.com/board' }),
  )
})
