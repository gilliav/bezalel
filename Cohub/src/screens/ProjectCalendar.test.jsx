import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
}))

const mockUseCourses = vi.hoisted(() => vi.fn())
const mockUseMilestones = vi.hoisted(() => vi.fn())
const mockUseAllProjects = vi.hoisted(() => vi.fn())
vi.mock('../hooks/useCourses', () => ({ useCourses: mockUseCourses }))
vi.mock('../hooks/useMilestones', () => ({ useMilestones: mockUseMilestones }))
vi.mock('../hooks/useProjects', () => ({ useAllProjects: mockUseAllProjects }))
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: null, signIn: vi.fn(), signOut: vi.fn() }) }))
vi.mock('../components/AuthSlot', () => ({ AuthSlot: () => null }))

import ProjectCalendar from './ProjectCalendar'

const at = (y, m, d) => ({ toDate: () => new Date(y, m, d, 23, 59) })

const courses = [
  { id: 'c1', name: 'סטודיו 03', color: '#E63946', day: 3 },
  { id: 'c2', name: 'מושן', color: '#457B9D' },
]

const milestones = [
  { id: 'm1', title: 'טיוטה', dueDate: at(2026, 9, 20), projectId: 'p1', courseId: 'c1', projectTitle: 'פוסטר' },
  { id: 'm2', title: 'הגשה סופית', dueDate: at(2026, 10, 3), projectId: 'p1', courseId: 'c1', projectTitle: 'פוסטר' },
  { id: 'm3', title: 'סקיצות', dueDate: at(2026, 9, 20), projectId: 'p9', courseId: 'old', projectTitle: 'ישן' },
]

const projects = [
  { id: 'p1', title: 'פוסטר', courseId: 'c1', dueDate: at(2026, 9, 25) },
  { id: 'p2', title: 'אנימציה', courseId: 'c2', dueDate: at(2026, 9, 28) },
]

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={['/cohub/calendar']}>
      <Routes>
        <Route path="/cohub/calendar" element={<ProjectCalendar />} />
        <Route path="/projects/:projectId" element={<div>project page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProjectCalendar screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 15, 12))
    mockUseCourses.mockReturnValue({ courses, loading: false })
    mockUseMilestones.mockReturnValue({ milestones, loading: false })
    mockUseAllProjects.mockReturnValue({ projects, loading: false })
  })
  afterEach(() => vi.useRealTimers())

  it('shows a loader while data is loading', () => {
    mockUseMilestones.mockReturnValue({ milestones: [], loading: true })
    const { container } = renderCalendar()
    expect(container.querySelector('.state-loading')).toBeInTheDocument()
  })

  it('shows the current month with its milestones and standalone projects', () => {
    renderCalendar()
    expect(screen.getByText(/אוקטובר 2026/)).toBeInTheDocument()
    expect(screen.getByText('טיוטה')).toBeInTheDocument()
    expect(screen.getByText('אנימציה')).toBeInTheDocument()
    // next month's milestone isn't listed yet
    expect(screen.queryByText('הגשה סופית')).not.toBeInTheDocument()
  })

  it('does not show a project on its own when it has milestones', () => {
    renderCalendar()
    // p1's own dueDate (Oct 25) is represented by its milestones only
    expect(screen.queryByRole('button', { name: /25 באוקטובר, / })).not.toBeInTheDocument()
  })

  it('hides items from courses outside the current semester', () => {
    renderCalendar()
    expect(screen.queryByText('סקיצות')).not.toBeInTheDocument()
  })

  it('marks days with the subject icon of each item\'s course', () => {
    renderCalendar()
    const day = screen.getByRole('button', { name: /28 באוקטובר/ })
    expect(within(day).getByTestId('day-icon').style.getPropertyValue('--icon')).toMatch(/grad-cup/)
    const twentieth = screen.getByRole('button', { name: /20 באוקטובר/ })
    expect(within(twentieth).getByTestId('day-icon').style.getPropertyValue('--icon')).toMatch(/chair-2/)
  })

  it('lists only the tapped day and clears it on a second tap', async () => {
    const user = userEvent.setup()
    renderCalendar()
    const day = screen.getByRole('button', { name: /28 באוקטובר/ })
    await user.click(day)
    expect(day).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('אנימציה')).toBeInTheDocument()
    expect(screen.queryByText('טיוטה')).not.toBeInTheDocument()
    await user.click(day)
    expect(screen.getByText('טיוטה')).toBeInTheDocument()
  })

  it('shows an empty state for a day with nothing due', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByRole('button', { name: /^יום שלישי, 6 באוקטובר$/ }))
    expect(screen.getByText('אין הגשות ביום הזה')).toBeInTheDocument()
  })

  it('offers that weekday\'s courses for a new project on an upcoming day', async () => {
    const user = userEvent.setup()
    renderCalendar()
    // Oct 21, 2026 is a Wednesday (day 3) — סטודיו 03 meets then
    await user.click(screen.getByRole('button', { name: /21 באוקטובר/ }))
    expect(screen.getByText('פרויקט חדש ליום הזה')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'סטודיו 03' }))
      .toHaveAttribute('href', '/projects/new?dueDate=2026-10-21&courseId=c1')
    expect(screen.getByRole('link', { name: 'קורס אחר' }))
      .toHaveAttribute('href', '/projects/new?dueDate=2026-10-21')
    expect(screen.queryByRole('link', { name: 'מושן' })).not.toBeInTheDocument()
  })

  it('offers a plain new project when no course meets that day', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByRole('button', { name: /^יום חמישי, 22 באוקטובר$/ }))
    const links = screen.getAllByRole('link', { name: /פרויקט חדש/ }).map(l => l.getAttribute('href'))
    expect(links).toContain('/projects/new?dueDate=2026-10-22')
    expect(screen.queryByRole('link', { name: 'קורס אחר' })).not.toBeInTheDocument()
  })

  it('does not offer a new project on a past day', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByRole('button', { name: /^יום שלישי, 6 באוקטובר$/ }))
    expect(screen.queryByText('פרויקט חדש ליום הזה')).not.toBeInTheDocument()
  })

  it('moves to the next month', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByRole('button', { name: 'חודש הבא' }))
    expect(screen.getByText(/נובמבר 2026/)).toBeInTheDocument()
    expect(screen.getByText('הגשה סופית')).toBeInTheDocument()
    expect(screen.queryByText('טיוטה')).not.toBeInTheDocument()
  })

  it('shows an empty state for a month with nothing due', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByRole('button', { name: 'חודש קודם' }))
    expect(screen.getByText('אין הגשות החודש')).toBeInTheDocument()
  })

  it('opens the project when an item is tapped', async () => {
    const user = userEvent.setup()
    renderCalendar()
    await user.click(screen.getByText('טיוטה'))
    expect(screen.getByText('project page')).toBeInTheDocument()
  })
})
