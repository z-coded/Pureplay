import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  Users,
  Video,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Trash2,
  Check,
  Play,
  Eye,
  RefreshCw,
} from 'lucide-react'
import {
  onVideosSnapshot,
  onUsersSnapshot,
  computeMetrics,
  aggregateViolationsByUser,
  approveVideo,
  deleteVideo,
} from '../lib/adminStorage.js'
import VideoModal from '../components/VideoModal.jsx'

function AdminDashboardPage() {
  const [videos, setVideos] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeVideo, setActiveVideo] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Real-time synchronization via onSnapshot (SDS §3.3)
  useEffect(() => {
    let videosUnsub = () => {}
    let usersUnsub = () => {}

    try {
      videosUnsub = onVideosSnapshot((items) => {
        setVideos(items)
        setLoading(false)
      })

      usersUnsub = onUsersSnapshot((items) => {
        setUsers(items)
      })
    } catch (err) {
      console.error('Error attaching listeners:', err)
      setLoading(false)
    }

    const timer = setTimeout(() => setLoading(false), 1200)

    return () => {
      videosUnsub()
      usersUnsub()
      clearTimeout(timer)
    }
  }, [])

  // KPI Metrics (SDS FR3.1: Total Uploads, Flagged, Approved)
  const metrics = useMemo(() => computeMetrics(videos), [videos])

  // Top Violators
  const topViolators = useMemo(() => aggregateViolationsByUser(videos).slice(0, 5), [videos])

  // Flagged videos queue (SDS FR3.2)
  const flaggedQueue = useMemo(
    () => videos.filter((v) => v.status === 'Flagged'),
    [videos],
  )

  const handleApprove = async (videoId) => {
    try {
      setActionLoading(videoId)
      await approveVideo(videoId)
    } catch (err) {
      console.error('Failed to approve video:', err)
      alert('Failed to approve video: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to permanently delete this video? This removes it from Firestore and Storage.')) {
      return
    }
    try {
      setActionLoading(videoId)
      await deleteVideo(videoId)
    } catch (err) {
      console.error('Failed to delete video:', err)
      alert('Failed to delete video: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-cyan-500">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-sm font-medium animate-pulse">Syncing real-time dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white">
            <ShieldAlert className="h-8 w-8 text-cyan-400" />
            Admin Operations Center
          </h1>
          <p className="mt-1 text-slate-400 text-sm sm:text-base">
            Real-time compliance monitoring, automated AI scoring, and admin override controls (SDS Modules 3–5).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Live WebSocket Sync Active</span>
        </div>
      </section>

      {/* KPI Cards (SDS §2.6.3 FR3.1) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Uploads */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Video className="h-28 w-28 text-cyan-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Uploads</span>
              <Video className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="mt-3 text-4xl font-extrabold text-white">{metrics.total}</p>
            <p className="mt-1 text-xs text-slate-400">All registered media assets</p>
          </div>
        </div>

        {/* Flagged Content */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 border-rose-500/30 bg-rose-500/5 group">
          <div className="absolute -right-4 -top-4 opacity-5 text-rose-500 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-28 w-28" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-bold uppercase tracking-wider">Flagged Queue</span>
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
            <p className="mt-3 text-4xl font-extrabold text-rose-400">{metrics.flagged}</p>
            <p className="mt-1 text-xs text-rose-300/70">Requiring moderator review</p>
          </div>
        </div>

        {/* Approved Content */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 border-emerald-500/30 bg-emerald-500/5 group">
          <div className="absolute -right-4 -top-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform">
            <CheckCircle className="h-28 w-28" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-bold uppercase tracking-wider">Approved Content</span>
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="mt-3 text-4xl font-extrabold text-emerald-400">{metrics.approved}</p>
            <p className="mt-1 text-xs text-emerald-300/70">Safe for viewing gallery</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-6 group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="h-28 w-28 text-indigo-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-xs font-bold uppercase tracking-wider">Platform Users</span>
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="mt-3 text-4xl font-extrabold text-white">{users.length}</p>
            <p className="mt-1 text-xs text-slate-400">Guardians & administrators</p>
          </div>
        </div>
      </section>

      {/* Flagged Content Review Queue (SDS FR3.2 & FR3.4) */}
      <section className="glass-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              Flagged Content Moderation Queue (FR3.2)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Violations detected by simulated AI models awaiting admin approval or deletion override (FR3.4).
            </p>
          </div>
          <Link
            to="/admin/videos"
            className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            All Videos Table <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {flaggedQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-slate-800 bg-slate-950/40 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
            <p className="text-base font-semibold text-white">Queue is clear!</p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              There are currently no flagged videos requiring administrative intervention.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Video Title</th>
                  <th className="px-4 py-3">Uploader</th>
                  <th className="px-4 py-3">AI Flags & Scores</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-sans">
                {flaggedQueue.slice(0, 5).map((vid) => (
                  <tr key={vid.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white truncate max-w-xs">{vid.title || vid.file_name}</div>
                      <div className="text-xs text-slate-500 font-mono truncate max-w-xs">{vid.file_name}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <div>{vid.user_email || 'Unknown'}</div>
                      <div className="text-slate-600 font-mono text-[10px]">
                        {vid.uploaded_at ? new Date(vid.uploaded_at).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {vid.ai_scores ? (
                          <>
                            <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/20">
                              NSFW: {(vid.ai_scores.nsfw * 100).toFixed(0)}%
                            </span>
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/20">
                              Profanity: {(vid.ai_scores.profanity * 100).toFixed(0)}%
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">Simulated Flag</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
                        ● Flagged
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            setActiveVideo({
                              fileName: vid.title || vid.file_name,
                              fileUrl: vid.download_url,
                              nsfwHits: vid.ai_scores?.nsfw > 0.7 ? 1 : 0,
                              profanityHits: vid.ai_scores?.profanity > 0.7 ? 1 : 0,
                              createdAt: vid.uploaded_at,
                            })
                          }
                          className="rounded-lg bg-slate-800 p-2 text-cyan-400 hover:bg-slate-700"
                          title="Preview Video"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          disabled={actionLoading === vid.id}
                          onClick={() => handleApprove(vid.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition disabled:opacity-50"
                          title="Approve (Admin Override)"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          disabled={actionLoading === vid.id}
                          onClick={() => handleDelete(vid.id)}
                          className="flex items-center gap-1 rounded-lg bg-rose-600/20 px-2.5 py-1.5 text-xs font-semibold text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition disabled:opacity-50"
                          title="Delete from Firestore & Storage"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bottom Grid: Top Violators & System Policy */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-card rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-rose-400 h-5 w-5" />
              Top Uploaders by Violations
            </h2>
            <Link
              to="/admin/users"
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              User Registry <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {topViolators.length > 0 ? (
              topViolators.map((u, idx) => (
                <div
                  key={u.userId || idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/50 border border-white/5"
                >
                  <div className="truncate pr-4">
                    <p className="font-semibold text-slate-200 truncate text-sm">{u.userEmail || u.userId}</p>
                    <p className="text-xs text-slate-500">{u.totalVideos} total videos submitted</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/20">
                      {u.flaggedCount} Flagged
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      {u.approvedCount} Safe
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm italic py-4 text-center">No video records found.</p>
            )}
          </div>
        </section>

        <section className="glass-card rounded-3xl p-8 bg-gradient-to-br from-indigo-500/10 to-transparent relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6">
              <ShieldAlert className="h-6 w-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Global Sensitivity Controls</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Adjust global AI sensitivity sliders for Profanity (Whisper/Detoxify) and NSFW content (NudeNet). Changes apply immediately across all guardian profiles.
            </p>
          </div>
          <Link to="/admin/settings" className="btn-primary w-full flex items-center justify-center gap-2">
            Configure Detection Policy <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>

      {activeVideo && <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />}
    </motion.div>
  )
}

export default AdminDashboardPage
