import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { CourseChecklist } from './CourseChecklist'

const courses = [
  { id: 'c1', name: 'תולדות האיור', lecturer: 'אורנה גרנות' },
  { id: 'c2', name: 'סכיזואנליזה', lecturer: 'אהד זהבי' },
  { id: 'c3', name: 'זכויות יוצרים', lecturer: 'איל פרייס' },
]

describe('CourseChecklist', () => {
  it('excludes courses already handled for this uid', () => {
    render(<CourseChecklist courses={courses} excludeIds={new Set(['c2'])} onDone={vi.fn()} />)
    expect(screen.getByText('תולדות האיור')).toBeInTheDocument()
    expect(screen.queryByText('סכיזואנליזה')).not.toBeInTheDocument()
  })

  it('filters by search term across name and lecturer', async () => {
    const user = userEvent.setup()
    render(<CourseChecklist courses={courses} excludeIds={new Set()} onDone={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('חיפוש לפי שם קורס או מרצה'), 'זכויות')

    expect(screen.getByText('זכויות יוצרים')).toBeInTheDocument()
    expect(screen.queryByText('תולדות האיור')).not.toBeInTheDocument()
  })

  it('disables Done until at least one course is checked', () => {
    render(<CourseChecklist courses={courses} excludeIds={new Set()} onDone={vi.fn()} />)
    expect(screen.getByRole('button', { name: /סיימתי/ })).toBeDisabled()
  })

  it('calls onDone with the checked course ids', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    render(<CourseChecklist courses={courses} excludeIds={new Set()} onDone={onDone} />)

    await user.click(screen.getByRole('checkbox', { name: /תולדות האיור/ }))
    await user.click(screen.getByRole('checkbox', { name: /זכויות יוצרים/ }))
    await user.click(screen.getByRole('button', { name: /סיימתי/ }))

    expect(onDone).toHaveBeenCalledWith(['c1', 'c3'])
  })
})
