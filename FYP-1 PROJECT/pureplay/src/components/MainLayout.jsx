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
        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
    }`

  const adminNavClass = ({ isActive }) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ${
      isActive
        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
    }`

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-[#070a11] flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-slate-950/80 sticky top-0 z-40 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative h-9 w-9 transition-transform group-hover:scale-105 drop-shadow-[0_0_10px_rgba(6,182,212,0.35)] flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="PurePlay Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  PurePlay
                </span>
                <span className="badge-cyan text-[10px] font-mono py-0 px-2">
                  Live
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-950/50 border border-white/[0.06] p-1 rounded-2xl">
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
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/[0.08]">
                <span className="badge-slate text-[10px] font-mono text-violet-400 border-violet-500/20 bg-violet-500/10">
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
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/80 border border-white/[0.06]">
              <span className={`h-1.5 w-1.5 rounded-full ${role === 'admin' ? 'bg-violet-400 shadow-[0_0_6px_#a78bfa]' : 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'}`} />
              <span className="capitalize text-slate-300 text-xs">{role}</span>
            </div>

            <div className="hidden sm:block">
              <ProfileSwitcher />
            </div>

            <button
              type="button"
              onClick={logOut}
              title="Log out"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
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
              className="xl:hidden border-t border-slate-800 bg-slate-950/95 px-6 py-6 backdrop-blur-2xl"
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
                  <div className="pt-4 border-t border-slate-800/80">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Admin Control Center</p>
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

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Logged in as <span className="font-semibold text-white">{user?.displayName || user?.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { closeMobile(); logOut(); }}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
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
      <footer className="border-t border-white/[0.06] bg-slate-950/60 backdrop-blur-xl mt-16 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-white/[0.06]">
            {/* System Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs">
                  P
                </div>
                <span className="font-bold text-white text-sm">PurePlay</span>
                <span className="badge-slate text-[10px] font-mono">
                  v1.0 Production
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Automated multi-modal video filtering and censorship platform utilizing NudeNet deep learning and real-time audio profanity suppression to safeguard child and adolescent media spaces.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono text-slate-400">
                <span className="badge-slate">PyTorch</span>
                <span className="badge-slate">NudeNet ONNX</span>
                <span className="badge-slate">OpenCV</span>
                <span className="badge-slate">FastAPI</span>
                <span className="badge-slate">Firestore</span>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Academic Reference</p>
              <p className="text-slate-300 font-medium text-xs">COMSATS University Islamabad</p>
              <p className="text-slate-400 text-xs">Department of Computer Science</p>
              <p className="text-slate-500 text-[11px] pt-0.5">Final Year Project Evaluation</p>
            </div>

            {/* Quick Links & Platform Status */}
            <div className="space-y-1.5">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">System Status</p>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
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
