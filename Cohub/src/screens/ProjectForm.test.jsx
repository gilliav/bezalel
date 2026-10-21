import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../firebase', () => ({ db: {}, storage: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), addDoc: vi.fn(), doc: vi.fn(), updateDoc: vi.fn(),
  Timestamp: { fromDate: vi.fn() }, serverTimestamp: vi.fn(),
  getDocs: vi.fn(), deleteDoc: vi.fn(), query: vi.fn(),
}))
vi.mock('firebase/storage', () => ({ ref: vi.fn(), uploadBytesResumable: vi.fn(), getDownloadURL: vi.fn() }))

const mockUseCourses = vi.hoisted(() => vi.fn())
vi.mock('../hooks/useCourses', () => ({ useCourses: mockUseCourses }))
vi.mock('../hooks/useProject', () => ({ useProject: () => ({ project: null, milestones: [], loading: false }) }))

import ProjectForm from './ProjectForm'

const courses = [
  { id: 'c1', name: 'סטודיו 03', day: 3 },
  { id: 'c2', name: 'סיפור', day: 4 },
]

function renderForm(url) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/projects/new" element={<ProjectForm />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProjectForm presets from the URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 15, 12)) // Thursday
    mockUseCourses.mockReturnValue({ courses, loading: false })
  })
  afterEach(() => vi.useRealTimers())

  it('selects the course and the matching week for a preset date', () => {
    renderForm('/projects/new?dueDate=2026-10-21&courseId=c1')
    expect(screen.getByRole('combobox')).toHaveValue('c1')
    // Oct 21 is the first Wednesday quick pick
    expect(screen.getByRole('button', { name: /21.10/ })).toHaveClass('bg-primary')
  })

  it('shows the preset date in a date input when it is not a quick pick', () => {
    const { container } = renderForm('/projects/new?dueDate=2026-10-22&courseId=c1')
    expect(container.querySelector('input[type="date"]')).toHaveValue('2026-10-22')
  })

  it('keeps the preset date when the course changes', async () => {
    const user = userEvent.setup()
    const { container } = renderForm('/projects/new?dueDate=2026-10-22')
    expect(container.querySelector('input[type="date"]')).toHaveValue('2026-10-22')
    await user.selectOptions(screen.getByRole('combobox'), 'c2')
    // Oct 22 is a Thursday, so it shows up among סיפור's quick picks
    expect(screen.getByRole('button', { name: /22.10/ })).toHaveClass('bg-primary')
  })

  it('ignores a malformed dueDate', () => {
    const { container } = renderForm('/projects/new?dueDate=tomorrow')
    expect(container.querySelector('input[type="date"]')).toHaveValue('')
  })
})
