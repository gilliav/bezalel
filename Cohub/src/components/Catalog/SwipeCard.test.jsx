import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { SwipeCard } from './SwipeCard'

const course = {
  id: 'c1',
  name: 'תולדות האיור',
  lecturer: 'אורנה גרנות',
  category: 'בחירה עיוני',
  description: 'איורים הם יצירות האמנות הראשונות שאנו מכירים.',
}

describe('SwipeCard', () => {
  it('shows the course name and description', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={vi.fn()} onNotTaken={vi.fn()} />)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).toBeInTheDocument()
  })

  it('disables submit until recommend is chosen', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={vi.fn()} onNotTaken={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'שליחה והמשך' })).toBeDisabled()
  })

  it('submits with the chosen recommend value and defaults for untouched optional fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SwipeCard course={course} onSubmit={onSubmit} onSkip={vi.fn()} onNotTaken={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'כן, ממליץ/ה' }))
    await user.click(screen.getByRole('button', { name: 'שליחה והמשך' }))

    expect(onSubmit).toHaveBeenCalledWith({
      recommend: true,
      profGood: null,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTaken: null,
      comment: '',
    })
  })

  it('calls onSkip when skip is clicked', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={onSkip} onNotTaken={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'דלג/י' }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('calls onNotTaken when "לא למדתי את הקורס" is clicked', async () => {
    const user = userEvent.setup()
    const onNotTaken = vi.fn()
    render(<SwipeCard course={course} onSubmit={vi.fn()} onSkip={vi.fn()} onNotTaken={onNotTaken} />)
    await user.click(screen.getByRole('button', { name: 'לא למדתי את הקורס' }))
    expect(onNotTaken).toHaveBeenCalled()
  })
})
