import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import Dashboard from './screens/Dashboard'
import CoursesList from './screens/CoursesList'
import CourseDetail from './screens/CourseDetail'
import ProjectDetail from './screens/ProjectDetail'
import ProjectForm from './screens/ProjectForm'
import Schedule from './screens/Schedule'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen pb-16 max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<CoursesList />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/projects/new" element={<ProjectForm />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/edit" element={<ProjectForm />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}
