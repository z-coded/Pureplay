import { useState, useEffect, useMemo } from 'react'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { onUserVideosSnapshot } from '../lib/adminStorage.js'
import { Shield, Users, Video, Play, Upload, Clock, CheckCircle2, AlertTriangle, Filter, Sparkles, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import VideoModal from '../components/VideoModal.jsx'
import { motion } from 'framer-motion'

function GuardianDashboardPage() {
  const { profiles, activeProfile, role, user } = useAuth()
  const [userVideos, setUserVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [activeVideo, setActiveVideo] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    if (!user?.uid) return
    const unsub = onUserVideosSnapshot(user.uid, (items) => {
      setUserVideos(items)
      setLoadingVideos(false)
    })
    return () => unsub()
  }, [user?.uid])

  const filteredVideos = useMemo(() => {
    if (statusFilter === 'All') return userVideos
    return userVideos.filter((v) => (v.status || 'Pending').toLowerCase() === statusFilter.toLowerCase())
  }, [userVideos, statusFilter])

  if (role === 'admin') {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-amber-100">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl font-bold">Admin Account Detected</h2>
        </div>
        <p className="mt-1 text-slate-300">
          Logged in with administrator privileges. You have full access to platform operations, flagged queues, user records, and sensitivity thresholds.
        </p>
        <div className="mt-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Go to Admin Control Center
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="badge-cyan text-[11px]">Parental Protection Active</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">ID: {user?.uid?.slice(0, 8)}...</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1.5 flex items-center gap-3">
            Guardian Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, <span className="text-slate-200 font-medium">{user?.displayName || user?.email}</span>. Monitor child safety policies, active guardrails, and media moderation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/upload"
            className="btn-primary text-sm py-2 px-4.5"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Media</span>
          </Link>
        </div>
      </section>

      {/* Modern Stats Overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard 
          label="Family Profiles" 
          value={profiles.length} 
          icon={Users} 
          subtitle="Managed child & teen accounts" 
        />
        <StatCard 
          label="Child Profiles" 
          value={profiles.filter((p) => p.type === 'child').length} 
          tone="rose" 
          icon={Shield} 
          subtitle="Protected by strict AI filters" 
        />
        <StatCard 
          label="Media In Vault" 
          value={userVideos.length} 
          tone="cyan" 
          icon={Video} 
          subtitle="Scanned through AI pipeline" 
        />
      </section>

      {/* Active Profile Enforcement Card */}
      <section className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-cyan-400" />
              Active Viewing Session
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Current profile rules actively applied on this device.</p>
          </div>
          <Link to="/profiles" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
            <span>Manage Profiles</span>
            <span>→</span>
          </Link>
        </div>

        {activeProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-950/50 border border-white/[0.06] p-4 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Profile</span>
                <p className="text-base font-bold text-white">{activeProfile.name}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-white/[0.06] p-4 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center font-bold text-violet-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Maturity Mode</span>
                <p className="text-base font-bold capitalize text-violet-300">{activeProfile.type} Mode</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/50 border border-white/[0.06] p-4 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">AI Content Guard</span>
                <p className="text-base font-bold text-emerald-400">
                  {activeProfile.type === 'child' ? 'Strict Censorship' : 'Standard Filter'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-950/40 border border-dashed border-slate-800 p-6 text-center">
            <p className="text-sm text-slate-400">
              No profile selected for this device. <Link to="/profiles" className="text-cyan-400 font-semibold hover:underline">Select a profile</Link> to enforce child safety rules.
            </p>
          </div>
        )}
      </section>

      {/* Family Media Vault */}
      <section className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="h-5 w-5 text-cyan-400" />
                Family Media Vault
              </h2>
              <span className="badge-slate text-[10px] font-mono">Live Sync</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time status of family videos scanned by PurePlay AI.</p>
          </div>

          {/* Clean Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800/80 p-1 rounded-xl self-start">
            {['All', 'Approved', 'Flagged', 'Pending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loadingVideos ? (
          <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span>Synchronizing media vault...</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <Video className="h-10 w-10 mx-auto text-slate-600 mb-2.5" />
            <p className="font-semibold text-slate-300">No media found in this view</p>
            <p className="text-xs mt-1 text-slate-500">
              {statusFilter === 'All' 
                ? 'Upload family videos to automatically scan them for adult content and profanity.' 
                : `No videos currently matching status '${statusFilter}'.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Video Details</th>
                  <th className="py-3 px-4 font-semibold">Date Added</th>
                  <th className="py-3 px-4 font-semibold">AI Safety Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredVideos.map((item) => {
                  const status = item.status || 'Pending'
                  return (
                    <tr key={item.id} className="text-slate-200 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white truncate">{item.title || item.file_name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-400 truncate line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                        {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {status === 'Approved' ? (
                          <span className="badge-emerald">● Approved Safe</span>
                        ) : status === 'Flagged' ? (
                          <span className="badge-rose">● Content Flagged</span>
                        ) : (
                          <span className="badge-amber">● AI Analyzing</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.download_url && (
                          <button
                            onClick={() =>
                              setActiveVideo({
                                url: item.download_url,
                                title: item.title || item.file_name,
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.url}
        title={activeVideo?.title}
      />
    </div>
  )
}

export default GuardianDashboardPage
