import { useEffect, useMemo, useState } from 'react'
import {
  onVideosSnapshot,
  approveVideo,
  deleteVideo,
  aggregateViolationsByUser,
} from '../lib/adminStorage.js'
import { Play, Download, Trash2, Check, Video, Search, Filter } from 'lucide-react'
import VideoModal from '../components/VideoModal.jsx'

function formatBytes(bytes) {
  if (!bytes) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function AdminVideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeVideo, setActiveVideo] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    const unsub = onVideosSnapshot((items) => {
      setVideos(items)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const byUser = useMemo(() => aggregateViolationsByUser(videos), [videos])

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase()
    return videos.filter((row) => {
      // Status filter
      if (statusFilter !== 'all') {
        const itemStatus = row.status || 'Pending'
        if (itemStatus.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      if (!q) return true
      return (
        (row.title && row.title.toLowerCase().includes(q)) ||
        (row.file_name && row.file_name.toLowerCase().includes(q)) ||
        (row.fileName && row.fileName.toLowerCase().includes(q)) ||
        (row.user_email && row.user_email.toLowerCase().includes(q)) ||
        (row.userEmail && row.userEmail.toLowerCase().includes(q)) ||
        String(row.user_id || row.userId || '').toLowerCase().includes(q)
      )
    })
  }, [videos, query, statusFilter])

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
    if (!window.confirm('Are you sure you want to delete this video? This removes both the Firestore document and the Storage asset.')) {
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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Video className="h-7 w-7 text-cyan-400" />
              Content Repository & Moderation Logs
            </h1>
            <span className="badge-slate font-mono text-[10px]">Cloud Datastore</span>
          </div>
          <p className="mt-1 text-slate-400 text-xs sm:text-sm">
            Inspect real-time asset telemetry, verify classification confidence, and execute moderation overrides.
          </p>
        </div>
      </section>

      {/* Main Filter & Table Section */}
      <section className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-white/[0.06] p-1 rounded-xl self-start">
            {['all', 'Flagged', 'Approved', 'Pending'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all' ? 'All Records' : st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search title, email, or filename..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10 pr-4 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Video Details</th>
                <th className="py-3 px-4">Uploader</th>
                <th className="py-3 px-4">AI Telemetry</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-4 text-right">Moderator Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-slate-950/30">
              {filteredVideos.map((row) => {
                const title = row.title || row.fileName || row.file_name
                const fileUrl = row.download_url || row.fileUrl
                const currentStatus = row.status || 'Pending'

                return (
                  <tr key={row.id} className="text-slate-200 hover:bg-slate-800/25 transition-colors">
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-semibold text-white truncate" title={title}>
                        {title}
                      </div>
                      {row.description && (
                        <p className="text-xs text-slate-400 truncate line-clamp-1 mt-0.5">{row.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                        <span>{formatBytes(row.file_size)}</span>
                        <span>•</span>
                        <span>{row.mime_type || 'video/mp4'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-300 font-medium">{row.user_email || row.userEmail || 'Guardian'}</div>
                      <div className="text-slate-500 font-mono text-[10px] mt-0.5">
                        {row.uploaded_at || row.processedAt
                          ? new Date(row.uploaded_at || row.processedAt).toLocaleDateString()
                          : '—'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {row.ai_scores ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <span
                            className={`font-semibold font-mono text-[11px] ${
                              row.ai_scores.nsfw > 0.7 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            NSFW: {(row.ai_scores.nsfw * 100).toFixed(0)}%
                          </span>
                          <span
                            className={`font-semibold font-mono text-[11px] ${
                              row.ai_scores.profanity > 0.7 ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            Profanity: {(row.ai_scores.profanity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-mono">
                          NSFW: {row.nsfwHits ?? 0} | Prof: {row.profanityHits ?? 0}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {currentStatus === 'Approved' ? (
                        <span className="badge-emerald">● Approved</span>
                      ) : currentStatus === 'Flagged' ? (
                        <span className="badge-rose">● Flagged</span>
                      ) : (
                        <span className="badge-amber">● Pending</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {fileUrl && (
                          <>
                            <button
                              onClick={() => setActiveVideo(row)}
                              className="rounded-lg border border-slate-700/80 bg-slate-800/60 p-1.5 text-cyan-300 hover:bg-slate-800 transition"
                              title="Play Video"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-1.5 text-indigo-300 hover:bg-indigo-500/20 transition"
                              title="Download Asset"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </>
                        )}

                        {/* Admin Override: Approve */}
                        {currentStatus !== 'Approved' && (
                          <button
                            disabled={actionLoading === row.id}
                            onClick={() => handleApprove(row.id)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition disabled:opacity-50"
                            title="Approve Video (Admin Override)"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Admin Delete */}
                        <button
                          disabled={actionLoading === row.id}
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/15 p-1.5 text-rose-300 hover:bg-rose-500/25 transition disabled:opacity-50"
                          title="Delete from Firestore & Storage"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredVideos.length === 0 && (
            <p className="py-12 text-center text-xs text-slate-500">No media records match the current filter query.</p>
          )}
        </div>
      </section>

      {/* Aggregated Rollup by User */}
      <section className="glass-card rounded-2xl p-6">
        <h2 className="text-base font-bold text-white">Aggregated Activity Rollup by Account</h2>
        <p className="mt-0.5 text-xs text-slate-400">Total uploads and violation metrics computed live from Firestore data.</p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/[0.06] bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">User Account</th>
                <th className="py-3 px-4">Total Uploads</th>
                <th className="py-3 px-4">Flagged Assets</th>
                <th className="py-3 px-4">Approved Assets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-slate-950/30">
              {byUser.map((row) => (
                <tr key={row.userId || row.userEmail} className="text-slate-200 hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white text-xs sm:text-sm">{row.userEmail || row.userId}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">{row.totalVideos}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <span className="badge-rose text-[10px]">{row.flaggedCount}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <span className="badge-emerald text-[10px]">{row.approvedCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {byUser.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No account activity recorded.</p>}
        </div>
      </section>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.download_url || activeVideo?.fileUrl}
        title={activeVideo?.title || activeVideo?.fileName || activeVideo?.file_name}
      />
    </div>
  )
}

export default AdminVideosPage
