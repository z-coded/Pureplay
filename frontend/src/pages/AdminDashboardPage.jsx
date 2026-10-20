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

  const metrics = useMemo(() => computeMetrics(videos), [videos])
  const topViolators = useMemo(() => aggregateViolationsByUser(videos).slice(0, 5), [videos])
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
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium animate-pulse text-slate-600">Syncing real-time dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              <ShieldAlert className="h-7 w-7 text-purple-700" />
              Admin Operations Center
            </h1>
            <span className="badge-slate font-mono text-[10px]">Command Center</span>
          </div>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Live compliance monitoring, automated AI scoring, and admin override controls across family uploads.
          </p>
        </div>
        <div className="badge-emerald self-start">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Uploads */}
        <div className="glass-card relative overflow-hidden rounded-2xl p-5 group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Uploads</span>
            <div className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Video className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900 font-mono">{metrics.total}</p>
          <p className="mt-1 text-xs text-slate-500">All registered media assets</p>
        </div>

        {/* Flagged Content */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-xs group">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Flagged Queue</span>
            <div className="h-8 w-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-rose-700 font-mono">{metrics.flagged}</p>
          <p className="mt-1 text-xs text-rose-600">Awaiting moderator decision</p>
        </div>

        {/* Approved Content */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs group">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Approved Content</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-emerald-700 font-mono">{metrics.approved}</p>
          <p className="mt-1 text-xs text-emerald-600">Public in child gallery</p>
        </div>

        {/* Total Users */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-xs group">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">Platform Accounts</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-indigo-900 font-mono">{users.length}</p>
          <p className="mt-1 text-xs text-indigo-600">Guardians & administrators</p>
        </div>
      </section>

      {/* Flagged Content Review Queue */}
      <section className="glass-card rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Flagged Content Moderation Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Items flagged by PurePlay AI vision and profanity models requiring manual approval or purge.
            </p>
          </div>
          <Link
            to="/admin/videos"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold self-start"
          >
            All Videos Repository <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {flaggedQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-600 mb-2.5" />
            <p className="text-sm font-semibold text-slate-900">Queue is clear!</p>
            <p className="text-xs text-slate-500 max-w-sm mt-0.5">
              There are currently no flagged videos requiring administrative intervention.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">Video Title</th>
                  <th className="px-4 py-3">Uploader</th>
                  <th className="px-4 py-3">AI Flags & Scores</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {flaggedQueue.slice(0, 5).map((vid) => (
                  <tr key={vid.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 truncate max-w-xs">{vid.title || vid.file_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-xs mt-0.5">{vid.file_name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div>{vid.user_email || 'Unknown'}</div>
                      <div className="text-slate-400 font-mono text-[10px] mt-0.5">
                        {vid.uploaded_at ? new Date(vid.uploaded_at).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {vid.ai_scores ? (
                          <>
                            <span className="badge-rose text-[10px] font-mono">
                              NSFW: {(vid.ai_scores.nsfw * 100).toFixed(0)}%
                            </span>
                            <span className="badge-amber text-[10px] font-mono">
                              Profanity: {(vid.ai_scores.profanity * 100).toFixed(0)}%
                            </span>
                          </>
                        ) : (
                          <span className="badge-rose text-[10px]">AI Flagged</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge-rose">
                        ● Flagged
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {vid.download_url && (
                          <button
                            onClick={() => setActiveVideo(vid)}
                            className="btn-secondary p-1.5 text-indigo-600"
                            title="Preview Video"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          disabled={actionLoading === vid.id}
                          onClick={() => handleApprove(vid.id)}
                          className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
                          title="Approve (Admin Override)"
                        >
                          <Check className="h-3 w-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          disabled={actionLoading === vid.id}
                          onClick={() => handleDelete(vid.id)}
                          className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                          title="Delete Permanently"
                        >
                          <Trash2 className="h-3 w-3" />
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
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-indigo-600 h-4 w-4" />
              Upload Activity Rollup by Account
            </h2>
            <Link
              to="/admin/users"
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
            >
              Registry <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {topViolators.length > 0 ? (
              topViolators.map((u, idx) => (
                <div
                  key={u.userId || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="truncate pr-3">
                    <p className="font-semibold text-slate-900 truncate text-xs sm:text-sm">{u.userEmail || u.userId}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{u.totalVideos} total videos submitted</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className="badge-rose text-[10px]">
                      {u.flaggedCount} Flagged
                    </span>
                    <span className="badge-emerald text-[10px]">
                      {u.approvedCount} Safe
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs italic py-6 text-center">No video upload records found.</p>
            )}
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-4 text-purple-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">Global AI Moderation Policies</h2>
            <p className="text-slate-600 mb-6 text-xs leading-relaxed">
              Calibrate baseline AI thresholds for visual nudity (NudeNet) and audio profanity (Whisper + Detoxify). Updates take effect immediately across all guardian profiles.
            </p>
          </div>
          <Link to="/admin/settings" className="btn-primary w-full text-xs flex items-center justify-center gap-2">
            Configure Policy Sliders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>

      {/* Video Modal Player with proper props */}
      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.download_url || activeVideo?.fileUrl}
        title={activeVideo?.title || activeVideo?.file_name || activeVideo?.fileName}
      />
    </motion.div>
  )
}

export default AdminDashboardPage
