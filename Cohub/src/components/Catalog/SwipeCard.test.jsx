import { render, screen, within } from '@testing-library/react'
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

// Scoped to the recommend field's own container even though, post-change,
// it's the only field using "חיובי"/"שלילי" labels — keeps the query robust
// if that ever changes again.
function getRecommendButton(name) {
  const field = screen.getByText('האם תמליץ/י על הקורס?').closest('.field')
  return within(field).getByRole('button', { name })
}

describe('SwipeCard', () => {
  it('shows the course name and description', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.getByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).toBeInTheDocument()
  })

  it('disables submit until recommend is chosen', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'אישור' })).toBeDisabled()
  })

  it('submits with the chosen recommend value and defaults for untouched optional fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SwipeCard course={course} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.click(getRecommendButton('חיובי'))
    await user.click(screen.getByRole('button', { name: 'אישור' }))

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

  it('calls onCancel when ביטול is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<SwipeCard course={course} onSubmit={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'ביטול' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('hides the course name and description when showCourseInfo is false', () => {
    render(<SwipeCard course={course} onSubmit={vi.fn()} onCancel={vi.fn()} showCourseInfo={false} />)
    expect(screen.queryByText('תולדות האיור')).not.toBeInTheDocument()
    expect(screen.queryByText('איורים הם יצירות האמנות הראשונות שאנו מכירים.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'אישור' })).toBeInTheDocument()
  })

  it('toggles attendance yes/no independently of the recommend thumbs field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SwipeCard course={course} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await user.click(getRecommendButton('חיובי'))
    await user.click(screen.getByRole('button', { name: 'כן' }))
    await user.click(screen.getByRole('button', { name: 'אישור' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ attendanceTaken: true }))
  })
})
