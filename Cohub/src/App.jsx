import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Toast } from './components/Toast'
import { ConnectionBanner } from './components/ConnectionBanner'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import Dashboard from './screens/Dashboard'
import CoursesList from './screens/CoursesList'
import CourseDetail from './screens/CourseDetail'
import ProjectDetail from './screens/ProjectDetail'
import ProjectForm from './screens/ProjectForm'
import Schedule from './screens/Schedule'

export default function App() {
  const [toastMessage, setToastMessage] = useState(null)
  const isOnline = useOnlineStatus()

  return (
    <BrowserRouter>
      <ConnectionBanner isOnline={isOnline} />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <div className="min-h-screen pb-16 max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard onError={setToastMessage} />} />
          <Route path="/courses" element={<CoursesList onError={setToastMessage} />} />
          <Route path="/courses/:courseId" element={<CourseDetail onError={setToastMessage} />} />
          <Route path="/projects/new" element={<ProjectForm onError={setToastMessage} />} />
          <Route path="/projects/:projectId" element={<ProjectDetail onError={setToastMessage} />} />
          <Route path="/projects/:projectId/edit" element={<ProjectForm onError={setToastMessage} />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}
