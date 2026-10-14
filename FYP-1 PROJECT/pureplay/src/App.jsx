import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import MainLayout from './components/MainLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import GuardianDashboardPage from './pages/GuardianDashboardPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import ProcessedVideosPage from './pages/ProcessedVideosPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminVideosPage from './pages/AdminVideosPage.jsx'
import AdminSettingsPage from './pages/AdminSettingsPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import NotAuthorizedPage from './pages/NotAuthorizedPage.jsx'
import ProfileManagementPage from './pages/ProfileManagementPage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/not-authorized" element={<NotAuthorizedPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<GuardianDashboardPage />} />
        <Route path="/profiles" element={<ProfileManagementPage />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute uploadGate>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route path="/processed-videos" element={<ProcessedVideosPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="videos" element={<AdminVideosPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
