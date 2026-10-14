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
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-amber-600" />
          <h2 className="text-2xl font-bold">Admin Account Detected</h2>
        </div>
        <p className="mt-1 text-slate-700">
          Logged in with administrator privileges. You have full access to platform operations, flagged queues, user records, and sensitivity thresholds.
        </p>
        <div className="mt-6">
          <Link
            to="/admin"
            className="btn-primary"
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
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="badge-cyan text-[11px]">Parental Protection Active</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">ID: {user?.uid?.slice(0, 8)}...</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5 flex items-center gap-3">
            Guardian Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <span className="text-slate-900 font-semibold">{user?.displayName || user?.email}</span>. Monitor child safety policies, active guardrails, and media moderation.
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
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              Active Viewing Session
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Current profile rules actively applied on this device.</p>
          </div>
          <Link to="/profiles" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1">
            <span>Manage Profiles</span>
            <span>→</span>
          </Link>
        </div>

        {activeProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-600">
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Profile</span>
                <p className="text-base font-bold text-slate-900">{activeProfile.name}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center font-bold text-purple-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Maturity Mode</span>
                <p className="text-base font-bold capitalize text-purple-700">{activeProfile.type} Mode</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">AI Content Guard</span>
                <p className="text-base font-bold text-emerald-700">
                  {activeProfile.type === 'child' ? 'Strict Censorship' : 'Standard Filter'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-6 text-center">
            <p className="text-sm text-slate-600">
              No profile selected for this device. <Link to="/profiles" className="text-indigo-600 font-semibold hover:underline">Select a profile</Link> to enforce child safety rules.
            </p>
          </div>
        )}
      </section>

      {/* Family Media Vault */}
      <section className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video className="h-5 w-5 text-indigo-600" />
                Family Media Vault
              </h2>
              <span className="badge-slate text-[10px] font-mono">Live Sync</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status of family videos scanned by PurePlay AI.</p>
          </div>

          {/* Clean Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl self-start">
            {['All', 'Approved', 'Flagged', 'Pending'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? 'bg-white text-indigo-700 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loadingVideos ? (
          <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>Synchronizing media vault...</span>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Video className="h-10 w-10 mx-auto text-slate-400 mb-2.5" />
            <p className="font-semibold text-slate-800">No media found in this view</p>
            <p className="text-xs mt-1 text-slate-500">
              {statusFilter === 'All' 
                ? 'Upload family videos to automatically scan them for adult content and profanity.' 
                : `No videos currently matching status '${statusFilter}'.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Video Details</th>
                  <th className="py-3 px-4 font-semibold">Date Added</th>
                  <th className="py-3 px-4 font-semibold">AI Safety Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVideos.map((item) => {
                  const status = item.status || 'Pending'
                  return (
                    <tr key={item.id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{item.title || item.file_name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 truncate line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
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
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            <Play className="h-3.5 w-3.5 text-indigo-600" />
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
