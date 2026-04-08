import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useAppStore } from './store/appStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return !user ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const { user, initialized, initialize } = useAuthStore()
  const { loadData, clear } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      loadData(user.id)
    } else if (initialized) {
      clear()
    }
  }, [user?.id, initialized])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
