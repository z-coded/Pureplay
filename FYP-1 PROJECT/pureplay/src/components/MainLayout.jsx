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
    `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
      isActive
        ? 'bg-cyan-500/15 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-cyan-500/20'
        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
    }`

  const adminNavClass = ({ isActive }) =>
    `flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
      isActive
        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
    }`

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative h-11 w-11 transition-all group-hover:scale-105 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="PurePlay Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  PurePlay
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  AI Active
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5">
            <NavLink className={navClass} to="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink className={navClass} to="/profiles">
              <Users className="h-4 w-4" />
              <span>Profiles</span>
            </NavLink>
            <NavLink className={navClass} to="/upload">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </NavLink>
            <NavLink className={navClass} to="/processed-videos">
              <Sparkles className="h-4 w-4" />
              <span>Processed</span>
            </NavLink>
            <NavLink className={navClass} to="/gallery">
              <Film className="h-4 w-4" />
              <span>Gallery</span>
            </NavLink>

            {role === 'admin' && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
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
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800">
              <span className={`h-2 w-2 rounded-full ${role === 'admin' ? 'bg-violet-400 shadow-[0_0_8px_#a78bfa]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'}`} />
              <span className="capitalize text-slate-300">{role}</span>
            </div>

            <div className="hidden sm:block">
              <ProfileSwitcher />
            </div>

            <button
              type="button"
              onClick={logOut}
              title="Log out"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
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
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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

      {/* FYP Academic Presentation Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-xl mt-16 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid gap-8 md:grid-cols-4 pb-8 border-b border-slate-800">
            {/* System Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-sm">
                  P
                </div>
                <span className="font-bold text-white text-base">PurePlay</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  FYP-1 Release
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Automated multi-modal video filtering and censorship platform utilizing NudeNet deep learning and real-time audio profanity suppression to safeguard children and adolescent media spaces.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">PyTorch v2.6</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">NudeNet ONNX</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">OpenCV</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">FastAPI</span>
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">Firebase Firestore</span>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-2">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Academic Institution</p>
              <p className="text-slate-300 font-medium">COMSATS University Islamabad</p>
              <p className="text-slate-400">Department of Computer Science</p>
              <p className="text-slate-500 text-[11px] pt-1">Final Year Project (FYP-1)</p>
            </div>

            {/* Quick Links & Platform Status */}
            <div className="space-y-2">
              <p className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">System Status</p>
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NudeNet Engine Operational</span>
              </div>
              <p className="text-slate-500 text-[11px]">Local inference latency: ~18ms / frame</p>
              <p className="text-slate-500 text-[11px]">Gaussian blur kernel: 51×51</p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© 2026 PurePlay AI. Developed for University Viva & Evaluation.</p>
            <div className="flex items-center gap-4">
              <span>Privacy & Ethics Policy</span>
              <span>•</span>
              <span>Model Card</span>
              <span>•</span>
              <span>Explainable AI (XAI)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout
