import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppShell from './components/layout/AppShell'
import Login    from './pages/Login'
import Dashboard from './pages/Dashboard'
import Entries   from './pages/Entries'
import Installments from './pages/Installments'
import Savings   from './pages/Savings'
import Config    from './pages/Config'
import Help      from './pages/Help'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <AppShell>
      <Routes>
        <Route path="/"             element={<Dashboard />} />
        <Route path="/asientos"     element={<Entries />} />
        <Route path="/cuotas"       element={<Installments />} />
        <Route path="/ahorro"       element={<Savings />} />
        <Route path="/config"       element={<Config />} />
        <Route path="/ayuda"        element={<Help />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
