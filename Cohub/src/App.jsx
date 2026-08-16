import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Toast } from './components/Toast'
import { ConnectionBanner } from './components/ConnectionBanner'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useAuth } from './hooks/useAuth'
import Home from './screens/Home'
import Dashboard from './screens/Dashboard'
import CoursesList from './screens/CoursesList'
import CourseDetail from './screens/CourseDetail'
import ProjectDetail from './screens/ProjectDetail'
import ProjectForm from './screens/ProjectForm'
import Schedule from './screens/Schedule'
import CatalogList from './screens/CatalogList'
import CatalogDetail from './screens/CatalogDetail'
import CatalogRate from './screens/CatalogRate'
import LecturerDetail from './screens/LecturerDetail'

function AppShell({ toastMessage, setToastMessage, isOnline }) {
  const location = useLocation()
  const { user } = useAuth()
  const isCatalogRoute = location.pathname.startsWith('/catalog')
  const isChooserRoute = location.pathname === '/'
  const hideBottomNav = isCatalogRoute || isChooserRoute
  const isWideRoute = location.pathname === '/catalog'
  // Cohub's screens (everything but the catalog and the chooser) read
  // Firestore collections gated by isAuthenticated() as soon as they mount.
  // On a fresh/direct load, Firebase Auth hasn't restored the session yet at
  // that point, so those reads fire with request.auth == null and come back
  // permission-denied — stuck until a refresh happens to win the race.
  // Waiting for the auth SDK's first callback (user !== undefined) before
  // mounting these routes avoids that race entirely.
  const authNotReady = !isCatalogRoute && !isChooserRoute && user === undefined

  return (
    <>
      <ConnectionBanner isOnline={isOnline} />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <div className={`min-h-screen pb-16 ${isWideRoute ? '' : 'max-w-lg mx-auto'}`}>
        {authNotReady ? (
          <div className="state-loading"/>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cohub" element={<Dashboard onError={setToastMessage} />} />
            <Route path="/courses" element={<CoursesList onError={setToastMessage} />} />
            <Route path="/courses/:courseId" element={<CourseDetail onError={setToastMessage} />} />
            <Route path="/projects/new" element={<ProjectForm onError={setToastMessage} />} />
            <Route path="/projects/:projectId" element={<ProjectDetail onError={setToastMessage} />} />
            <Route path="/projects/:projectId/edit" element={<ProjectForm onError={setToastMessage} />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/catalog" element={<CatalogList onError={setToastMessage} />} />
            <Route path="/catalog/rate" element={<CatalogRate onError={setToastMessage} />} />
            <Route path="/catalog/:courseId/rate" element={<CatalogDetail onError={setToastMessage} />} />
            <Route path="/catalog/:courseId" element={<CatalogDetail onError={setToastMessage} />} />
            <Route path="/lecturer/:lecturerName" element={<LecturerDetail onError={setToastMessage} />} />
          </Routes>
        )}
      </div>
      {!hideBottomNav && <BottomNav />}
    </>
  )
}

export default function App() {
  const [toastMessage, setToastMessage] = useState(null)
  const isOnline = useOnlineStatus()

  return (
    <BrowserRouter>
      <AppShell toastMessage={toastMessage} setToastMessage={setToastMessage} isOnline={isOnline} />
    </BrowserRouter>
  )
}
