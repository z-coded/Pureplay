import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getFirebaseAuthMessage } from '../utils/firebaseAuthErrors.js'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

function LoginPage() {
  const navigate = useNavigate()
  const { logIn, signInWithGoogle, isFirebaseConfigured } = useAuth()
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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <img src="/logo.png" alt="PurePlay" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">
              PurePlay
            </span>
          </div>

          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage profiles and video filters.</p>


          <div className="mt-6">
            <GoogleSignInButton disabled={!isFirebaseConfigured} onClick={handleGoogle} />
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-400 font-mono">
              or credentials
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-2xs"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-2xs"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
              type="submit"
              disabled={submitting}
            >
              <span>{submitting ? 'Verifying Session...' : 'Sign In to PurePlay'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
