import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFirebaseAuthMessage } from '../utils/firebaseAuthErrors.js'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { Eye, EyeOff, ShieldCheck, UserCheck, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

function LoginPage() {
  const navigate = useNavigate()
  const { logIn, signInWithGoogle, isFirebaseConfigured, demoLogin } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setSubmitting(true)
      await logIn(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(
        err?.message === 'Firebase is not configured'
          ? 'Firebase is not configured. Add your VITE_FIREBASE_* values in .env and restart.'
          : getFirebaseAuthMessage(err),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(
        err?.message === 'Firebase is not configured'
          ? 'Firebase is not configured. Add your VITE_FIREBASE_* values in .env and restart.'
          : getFirebaseAuthMessage(err),
      )
    }
  }

  const handleDemo = (role) => {
    demoLogin(role)
    if (role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/85 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <img src="/logo.png" alt="PurePlay" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              PurePlay
            </span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage profiles and video filters.</p>

          {/* Quick Evaluator Access */}
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-slate-900/40 p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Quick Evaluation Mode
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Test</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Instant access for viva examiners without entering credentials:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('guardian')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition"
              >
                <UserCheck className="h-4 w-4" />
                <span>Guardian Portal</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo('admin')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/25 active:scale-95 transition"
              >
                <ShieldCheck className="h-4 w-4 text-violet-400" />
                <span>Admin View</span>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <GoogleSignInButton disabled={!isFirebaseConfigured} onClick={handleGoogle} />
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900 px-3 text-xs uppercase tracking-wider text-slate-500 font-mono">
              or credentials
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="name@pureplay.dev"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              type="submit"
              disabled={submitting}
            >
              <span>{submitting ? 'Verifying Session...' : 'Sign In to PurePlay'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold text-cyan-400 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
