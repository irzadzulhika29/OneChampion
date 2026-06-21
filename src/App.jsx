import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { initAuth } from '@/store/auth'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/hooks/use-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import LombaListPage from '@/pages/LombaList'
import LombaDetailPage from '@/pages/LombaDetail'
import KalenderPage from '@/pages/Kalender'
import TimPage from '@/pages/Tim'
import TimDetailPage from '@/pages/TimDetail'
import RiwayatPage from '@/pages/Riwayat'
import SettingsPage from '@/pages/Settings'

export default function App() {
  useEffect(() => {
    initAuth()
  }, [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="lomba" element={<LombaListPage />} />
          <Route path="lomba/:id" element={<LombaDetailPage />} />
          <Route path="kalender" element={<KalenderPage />} />
          <Route path="tim" element={<TimPage />} />
          <Route path="tim/:id" element={<TimDetailPage />} />
          <Route path="riwayat" element={<RiwayatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
