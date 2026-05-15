import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../firebase', () => ({ db: {} }))

const mockAddDoc = vi.hoisted(() => vi.fn())
const mockCollection = vi.hoisted(() => vi.fn())
vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  collection: mockCollection,
}))

vi.mock('../utils/colors', () => ({
  COURSE_COLORS: ['#E63946', '#457B9D', '#2A9D8F', '#E9C46A'],
}))

import { AddCourseForm } from './AddCourseForm'

function fillRequired() {
  fireEvent.change(screen.getByLabelText('שם הקורס'), { target: { value: 'קורס חדש' } })
}

describe('AddCourseForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all fields including online toggle', () => {
    render(<AddCourseForm courses={[]} onClose={() => {}} onError={() => {}} />)
    expect(screen.getByLabelText('שם הקורס')).toBeInTheDocument()
    expect(screen.getByLabelText('קורס מקוון')).toBeInTheDocument()
    expect(screen.getByLabelText('יום')).toBeInTheDocument()
    expect(screen.getByLabelText('שעות')).toBeInTheDocument()
    expect(screen.getByLabelText('מיקום')).toBeInTheDocument()
    expect(screen.getByLabelText('צבע מותאם אישית')).toBeInTheDocument()
  })

  it('hides day, hours, location when online toggle is checked', () => {
    render(<AddCourseForm courses={[]} onClose={() => {}} onError={() => {}} />)
    fireEvent.click(screen.getByLabelText('קורס מקוון'))
    expect(screen.queryByLabelText('יום')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('שעות')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('מיקום')).not.toBeInTheDocument()
  })

  it('shows day, hours, location when online toggle is unchecked', () => {
    render(<AddCourseForm courses={[]} onClose={() => {}} onError={() => {}} />)
    fireEvent.click(screen.getByLabelText('קורס מקוון'))
    fireEvent.click(screen.getByLabelText('קורס מקוון'))
    expect(screen.getByLabelText('יום')).toBeInTheDocument()
    expect(screen.getByLabelText('שעות')).toBeInTheDocument()
    expect(screen.getByLabelText('מיקום')).toBeInTheDocument()
  })

  it('submits isOnline=true and omits day/hours/location when toggled on', async () => {
    mockAddDoc.mockResolvedValue({ id: 'new-id' })
    mockCollection.mockReturnValue('colRef')
    const onClose = vi.fn()

    render(<AddCourseForm courses={[]} onClose={onClose} onError={() => {}} />)
    fillRequired()
    fireEvent.click(screen.getByLabelText('קורס מקוון'))
    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }))

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledOnce())
    const [, data] = mockAddDoc.mock.calls[0]
    expect(data.isOnline).toBe(true)
    expect(data.day).toBeUndefined()
    expect(data.hours).toBeUndefined()
    expect(data.location).toBeUndefined()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('submits isOnline=false with day/hours/location when toggle is off', async () => {
    mockAddDoc.mockResolvedValue({ id: 'new-id' })
    mockCollection.mockReturnValue('colRef')
    const onClose = vi.fn()

    render(<AddCourseForm courses={[]} onClose={onClose} onError={() => {}} />)
    fillRequired()
    fireEvent.change(screen.getByLabelText('שעות'), { target: { value: '10:00-13:00' } })
    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }))

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledOnce())
    const [, data] = mockAddDoc.mock.calls[0]
    expect(data.isOnline).toBe(false)
    expect(data.hours).toBe('10:00-13:00')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('selects first unused palette color by default', () => {
    // courses already use '#E63946', so first unused is '#457B9D'
    const courses = [{ color: '#E63946' }]
    render(<AddCourseForm courses={courses} onClose={() => {}} onError={() => {}} />)
    const selected = screen.getByRole('radio', { name: '#457B9D' })
    expect(selected).toBeChecked()
  })

  it('marks used colors with data-used attribute', () => {
    const courses = [{ color: '#E63946' }]
    render(<AddCourseForm courses={courses} onClose={() => {}} onError={() => {}} />)
    const usedSwatch = screen.getByRole('radio', { name: '#E63946' })
    expect(usedSwatch.closest('[data-used]')).toBeTruthy()
  })

  it('allows selecting a used color', () => {
    const courses = [{ color: '#E63946' }]
    render(<AddCourseForm courses={courses} onClose={() => {}} onError={() => {}} />)
    const usedSwatch = screen.getByRole('radio', { name: '#E63946' })
    fireEvent.click(usedSwatch)
    expect(usedSwatch).toBeChecked()
  })

  it('custom hex input overrides palette selection', async () => {
    mockAddDoc.mockResolvedValue({ id: 'x' })
    mockCollection.mockReturnValue('colRef')

    render(<AddCourseForm courses={[]} onClose={() => {}} onError={() => {}} />)
    fillRequired()
    fireEvent.change(screen.getByLabelText('צבע מותאם אישית'), { target: { value: '#123456' } })
    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }))

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledOnce())
    const [, data] = mockAddDoc.mock.calls[0]
    expect(data.color).toBe('#123456')
  })

  it('calls onError and does not close on addDoc failure', async () => {
    mockAddDoc.mockRejectedValue(new Error('permission denied'))
    mockCollection.mockReturnValue('colRef')
    const onClose = vi.fn()
    const onError = vi.fn()

    render(<AddCourseForm courses={[]} onClose={onClose} onError={onError} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }))

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    render(<AddCourseForm courses={[]} onClose={onClose} onError={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /ביטול/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
