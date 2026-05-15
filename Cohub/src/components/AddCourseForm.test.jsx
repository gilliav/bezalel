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
  getCourseColor: vi.fn(() => '#E63946'),
  COURSE_COLORS: ['#E63946', '#457B9D', '#2A9D8F'],
}))

import { AddCourseForm } from './AddCourseForm'

function fillRequired(overrides = {}) {
  const fields = {
    'שם הקורס': 'טיפוגרפיה ב׳',
    'מרצה': 'כהן משה',
    'שעות': '10:00-13:00',
    'מיקום': 'סטודיו 135',
    ...overrides,
  }
  for (const [label, value] of Object.entries(fields)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  // day dropdown
  fireEvent.change(screen.getByLabelText('יום'), { target: { value: '1' } })
}

describe('AddCourseForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all required and optional fields', () => {
    render(<AddCourseForm courses={[]} onClose={() => {}} onError={() => {}} />)
    expect(screen.getByLabelText('שם הקורס')).toBeInTheDocument()
    expect(screen.getByLabelText('יום')).toBeInTheDocument()
    expect(screen.getByLabelText('שעות')).toBeInTheDocument()
    expect(screen.getByLabelText('מרצה')).toBeInTheDocument()
    expect(screen.getByLabelText('מיקום')).toBeInTheDocument()
    expect(screen.getByLabelText('צבע')).toBeInTheDocument()
    expect(screen.getByLabelText('קישור')).toBeInTheDocument()
    expect(screen.getByLabelText('הערות')).toBeInTheDocument()
  })

  it('calls addDoc with correct data on submit', async () => {
    mockAddDoc.mockResolvedValue({ id: 'new-id' })
    mockCollection.mockReturnValue('colRef')
    const onClose = vi.fn()

    render(<AddCourseForm courses={[]} onClose={onClose} onError={() => {}} />)
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: /הוסף/i }))

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalledOnce())
    const [, data] = mockAddDoc.mock.calls[0]
    expect(data.name).toBe('טיפוגרפיה ב׳')
    expect(data.lecturer).toBe('כהן משה')
    expect(data.hours).toBe('10:00-13:00')
    expect(data.location).toBe('סטודיו 135')
    expect(data.day).toBe(1)
    expect(data.color).toBe('#E63946')
    expect(onClose).toHaveBeenCalledOnce()
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

  it('cycles color on swatch click', () => {
    render(<AddCourseForm courses={[]} onClose={() => {}} onError={() => {}} />)
    const swatch = screen.getByLabelText('צבע')
    const initial = swatch.style.backgroundColor
    fireEvent.click(swatch)
    expect(swatch.style.backgroundColor).not.toBe(initial)
  })
})
