import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, allowedRoles, uploadGate = false }) {
  const { user, loading, role, activeProfile } = useAuth()

  if (loading) {
    return <div className="p-8 text-center text-slate-300">Loading your workspace...</div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/not-authorized" replace />

  if (uploadGate && activeProfile?.type === 'child') {
    return (
      <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-red-600/50 bg-red-950/40 p-8 text-center">
        <h2 className="text-2xl font-bold text-red-300">Upload blocked for Child profiles</h2>
        <p className="mt-3 text-red-100">
          Child-level accounts can watch filtered content but cannot upload videos.
        </p>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
