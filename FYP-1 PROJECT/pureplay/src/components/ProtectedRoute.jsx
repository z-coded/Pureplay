import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ShieldAlert, ArrowRight, Lock, LayoutDashboard, Users, UserCheck } from 'lucide-react'
import { motion } from 'framer-motion'

function ProtectedRoute({ children, allowedRoles, uploadGate = false }) {
  const { user, loading, role, activeProfile, profiles, switchProfile, createProfile } = useAuth()
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [showPinInput, setShowPinInput] = useState(false)

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your workspace...</div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/not-authorized" replace />

  if (uploadGate && activeProfile?.type === 'child') {
    const guardianProfile = profiles.find((p) => p.type === 'guardian')

    const handleDirectSwitch = () => {
      if (activeProfile?.pin && !showPinInput) {
        setShowPinInput(true)
        return
      }

      if (guardianProfile) {
        const res = switchProfile(guardianProfile.id, pinInput)
        if (!res.success) {
          setPinError(res.error || 'Could not switch profile.')
        }
      } else {
        const newGuardian = createProfile({
          name: user?.displayName ? `${user.displayName} (Guardian)` : 'Guardian (Parent)',
          type: 'guardian',
          pin: '',
          policy: { nudity: 0.85, violence: 0.85, profanity: 0.90 },
        })
        if (newGuardian?.id) {
          switchProfile(newGuardian.id)
        }
      }
    }

    const handlePinSubmit = (e) => {
      e.preventDefault()
      if (!pinInput.trim()) {
        setPinError('Please enter your security PIN.')
        return
      }
      if (guardianProfile) {
        const res = switchProfile(guardianProfile.id, pinInput)
        if (!res.success) {
          setPinError(res.error || 'Incorrect security PIN.')
        }
      }
    }

    return (
      <div className="mx-auto mt-8 max-w-xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-lg"
        >
          {/* Header Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800 mb-3">
            <span>Parental Protection Active</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Upload Restricted in Child Profile
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Child-level accounts can watch safe, filtered content but are restricted from uploading new media to the family vault.
          </p>

          {/* Session Overview Card */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Active Profile</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {activeProfile.name} (Child Mode)
              </span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Guardian Account</span>
              <span className="font-mono text-slate-700 truncate max-w-[200px]">
                {user.email || user.displayName}
              </span>
            </div>
          </div>

          {/* PIN Input or Switch Button */}
          <div className="mt-6 space-y-3">
            {showPinInput ? (
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  <span>Enter Profile PIN to switch to Guardian mode</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value)
                    setPinError('')
                  }}
                  placeholder="••••"
                  className="input-field text-center text-lg tracking-widest font-mono py-2"
                />
                {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinInput(false)
                      setPinError('')
                      setPinInput('')
                    }}
                    className="btn-secondary flex-1 py-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1 py-2 text-xs">
                    Verify & Switch
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={handleDirectSwitch}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                <UserCheck className="h-4 w-4" />
                <span>
                  Switch to {guardianProfile?.name || 'Guardian Profile'} & Upload
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
              <Link
                to="/profiles"
                className="font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Manage Family Profiles</span>
              </Link>
              <span className="hidden sm:inline text-slate-300">•</span>
              <Link
                to="/dashboard"
                className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
