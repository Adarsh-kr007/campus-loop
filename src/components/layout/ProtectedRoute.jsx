import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, ready } = useApp()
  const location = useLocation()
  if (!ready) return <div className="route-loading" role="status">Loading demo session…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
