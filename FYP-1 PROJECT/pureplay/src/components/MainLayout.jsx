import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ProfileSwitcher from './ProfileSwitcher.jsx'
import {
  Shield,
  Menu,
  X,
  LogOut,
  Upload,
  LayoutDashboard,
  Users,
  Film,
  Sliders,
  CheckCircle2,
  Sparkles,
  Lock,
  Cpu,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function MainLayout() {
  const { role, user, logOut, activeProfile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  const adminNavClass = ({ isActive }) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
      isActive
        ? 'bg-purple-100 text-purple-800 border border-purple-200'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 sticky top-0 z-40 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 transition-transform group-hover:scale-105 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="PurePlay Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black bg-gradient-to-r from-indigo-600 via-sky-600 to-blue-600 bg-clip-text text-transparent">
                  PurePlay
                </span>
                <span className="badge-cyan text-[10px] font-mono py-0 px-2">
                  Live
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/80 border border-slate-200/80 p-1 rounded-2xl">
            <NavLink className={navClass} to="/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink className={navClass} to="/profiles">
              <Users className="h-3.5 w-3.5" />
              <span>Profiles</span>
            </NavLink>
            <NavLink className={navClass} to="/upload">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
            </NavLink>
            <NavLink className={navClass} to="/processed-videos">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Processed</span>
            </NavLink>
            <NavLink className={navClass} to="/gallery">
              <Film className="h-3.5 w-3.5" />
              <span>Gallery</span>
            </NavLink>

            {role === 'admin' && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                <span className="badge-slate text-[10px] font-mono text-purple-700 border-purple-200 bg-purple-50">
                  Admin
                </span>
                <NavLink className={adminNavClass} to="/admin" end>
                  Overview
                </NavLink>
                <NavLink className={adminNavClass} to="/admin/users">
                  Users
                </NavLink>
                <NavLink className={adminNavClass} to="/admin/videos">
                  Videos
                </NavLink>
                <NavLink className={adminNavClass} to="/admin/settings">
                  Settings
                </NavLink>
              </div>
            )}
          </nav>

          {/* User Controls & Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Role Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${role === 'admin' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
              <span className="capitalize text-slate-700 text-xs">{role}</span>
            </div>

            <div className="hidden sm:block">
              <ProfileSwitcher />
            </div>

            <button
              type="button"
              onClick={logOut}
              title="Log out"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs transition hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden border-t border-slate-200 bg-white/98 px-6 py-6 backdrop-blur-2xl shadow-xl"
            >
              <div className="space-y-6">
                <div className="sm:hidden">
                  <ProfileSwitcher />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Guardian Navigation</p>
                  <div className="grid gap-1">
                    <NavLink className={navClass} to="/dashboard" onClick={closeMobile}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </NavLink>
                    <NavLink className={navClass} to="/profiles" onClick={closeMobile}>
                      <Users className="h-4 w-4" />
                      <span>Profiles</span>
                    </NavLink>
                    <NavLink className={navClass} to="/upload" onClick={closeMobile}>
                      <Upload className="h-4 w-4" />
                      <span>Upload Media</span>
                    </NavLink>
                    <NavLink className={navClass} to="/processed-videos" onClick={closeMobile}>
                      <Sparkles className="h-4 w-4" />
                      <span>Processed Reports</span>
                    </NavLink>
                    <NavLink className={navClass} to="/gallery" onClick={closeMobile}>
                      <Film className="h-4 w-4" />
                      <span>Approved Gallery</span>
                    </NavLink>
                  </div>
                </div>

                {role === 'admin' && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 mb-2">Admin Control Center</p>
                    <div className="grid gap-1">
                      <NavLink className={adminNavClass} to="/admin" end onClick={closeMobile}>
                        Admin Overview
                      </NavLink>
                      <NavLink className={adminNavClass} to="/admin/users" onClick={closeMobile}>
                        User Accounts
                      </NavLink>
                      <NavLink className={adminNavClass} to="/admin/videos" onClick={closeMobile}>
                        Video Moderation Queue
                      </NavLink>
                      <NavLink className={adminNavClass} to="/admin/settings" onClick={closeMobile}>
                        Global Settings
                      </NavLink>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Logged in as <span className="font-semibold text-slate-900">{user?.displayName || user?.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { closeMobile(); logOut(); }}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex-1 w-full">
        <Outlet />
      </main>

      {/* FYP Evaluation Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-xl mt-16 text-slate-600 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-slate-200">
            {/* System Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black text-xs">
                  P
                </div>
                <span className="font-bold text-slate-900 text-sm">PurePlay</span>
                <span className="badge-slate text-[10px] font-mono">
                  v1.0 Production
                </span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed max-w-md">
                Automated multi-modal video filtering and censorship platform utilizing NudeNet deep learning and real-time audio profanity suppression to safeguard child and adolescent media spaces.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                <span className="badge-slate">PyTorch</span>
                <span className="badge-slate">NudeNet ONNX</span>
                <span className="badge-slate">OpenCV</span>
                <span className="badge-slate">FastAPI</span>
                <span className="badge-slate">Firestore</span>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">Academic Reference</p>
              <p className="text-slate-700 font-medium text-xs">COMSATS University Islamabad</p>
              <p className="text-slate-600 text-xs">Department of Computer Science</p>
              <p className="text-slate-500 text-[11px] pt-0.5">Final Year Project Evaluation</p>
            </div>

            {/* Quick Links & Platform Status */}
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">System Status</p>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Engines Operational</span>
              </div>
              <p className="text-slate-500 text-[11px]">Inference latency: ~18ms / frame</p>
              <p className="text-slate-500 text-[11px]">Gaussian blur kernel: 51×51</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© 2026 PurePlay AI. Child-Safe Video Content Moderation Platform.</p>
            <div className="flex items-center gap-3">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Model Card</span>
              <span>•</span>
              <span>Explainable AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
