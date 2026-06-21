import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './Pages/Landing/Landing'
import Auth from './Pages/Auth/Auth'
import VerifyEmail from './Pages/Auth/VerifyEmail'
import ResetPassword from './Pages/Auth/ResetPassword'
import Dashboard from './Pages/Dashboard/Dashboard'
import MyCourses from './Pages/Dashboard/MyCourses'
import Catalog from './Pages/Dashboard/Catalog'
import Documents from './Pages/Dashboard/Documents'
import Profile from './Pages/Dashboard/Profile'
import Settings from './Pages/Dashboard/Settings'
import ManageCourses from './Pages/Dashboard/ManageCourses'
import CourseForm from './Pages/Dashboard/CourseForm'
import UsersAdmin from './Pages/Dashboard/UsersAdmin'
import CourseDetail from './Pages/Dashboard/CourseDetail'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<MyCourses />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="documents" element={<Documents />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="manage-courses" element={<ManageCourses />} />
            <Route path="manage-courses/new" element={<CourseForm />} />
            <Route path="manage-courses/:id/edit" element={<CourseForm />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="courses/:id" element={<CourseDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
