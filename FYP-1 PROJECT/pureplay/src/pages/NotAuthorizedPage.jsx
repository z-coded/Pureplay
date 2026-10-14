import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, KeyRound, Lock, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

function NotAuthorizedPage() {
  const navigate = useNavigate()
  const { demoLogin, role } = useAuth()

  const handleAdminSwitch = () => {
    demoLogin('admin')
    navigate('/admin')
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900/80 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        {/* Ambient red glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-8 w-8" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 animate-ping" />
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Security Clearance: 403 Forbidden
            </span>
            <h1 className="text-3xl font-black text-white mt-3 tracking-tight">Access Restricted</h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Your active session or profile does not possess the required cryptographic permissions to access this administrative zone.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-left space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Current Session Role:</span>
              <span className="font-mono font-bold text-cyan-400 capitalize">{role || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Required Clearance:</span>
              <span className="font-mono font-bold text-violet-400">Administrator (Platform Overseer)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-bold text-slate-200 transition"
            >
              <Home className="h-4 w-4" />
              <span>Guardian Dashboard</span>
            </Link>
            <button
              onClick={handleAdminSwitch}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-violet-600/20 hover:brightness-110 transition"
            >
              <KeyRound className="h-4 w-4" />
              <span>Switch to Admin Role</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default NotAuthorizedPage
