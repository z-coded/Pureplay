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
      <section>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Video className="h-8 w-8 text-cyan-400" />
          Content Repository & Moderation Logs
        </h1>
        <p className="mt-2 text-slate-400">
          Full video log database from Firestore `videos` collection. Inspect metadata, status lifecycle, and execute administrator overrides (Approve/Delete).
        </p>
      </section>

      {/* Main Filter & Table Section */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'Flagged', 'Approved', 'Pending'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st === 'all' ? 'All Videos' : st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search title, email, or filename..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 font-medium">Video / Metadata</th>
                <th className="py-3 px-4 font-medium">Uploader</th>
                <th className="py-3 px-4 font-medium">AI Analysis</th>
                <th className="py-3 px-4 font-medium">Status (SDS FR3.2)</th>
                <th className="py-3 px-4 text-right font-medium">Actions (SDS FR3.4)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredVideos.map((row) => {
                const title = row.title || row.fileName || row.file_name
                const fileUrl = row.download_url || row.fileUrl
                const currentStatus = row.status || 'Pending'

                return (
                  <tr key={row.id} className="text-slate-200 hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 max-w-[260px]">
                      <div className="font-semibold text-white truncate" title={title}>
                        {title}
                      </div>
                      {row.description && (
                        <p className="text-xs text-slate-400 truncate line-clamp-1">{row.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 mt-1">
                        <span>{formatBytes(row.file_size)}</span>
                        <span>•</span>
                        <span>{row.mime_type || 'video'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs">
                      <div className="text-slate-300 font-medium">{row.user_email || row.userEmail || 'User'}</div>
                      <div className="text-slate-500 font-mono text-[10px] mt-0.5">
                        {row.uploaded_at || row.processedAt
                          ? new Date(row.uploaded_at || row.processedAt).toLocaleString()
                          : '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {row.ai_scores ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <span
                            className={`font-semibold ${
                              row.ai_scores.nsfw > 0.7 ? 'text-rose-400' : 'text-slate-400'
                            }`}
                          >
                            NSFW: {(row.ai_scores.nsfw * 100).toFixed(0)}%
                          </span>
                          <span
                            className={`font-semibold ${
                              row.ai_scores.profanity > 0.7 ? 'text-amber-400' : 'text-slate-400'
                            }`}
                          >
                            Profanity: {(row.ai_scores.profanity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">
                          NSFW: {row.nsfwHits ?? 0} | Prof: {row.profanityHits ?? 0}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          currentStatus === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : currentStatus === 'Flagged'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        ● {currentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {fileUrl && (
                          <>
                            <button
                              onClick={() => setActiveVideo(row)}
                              className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 hover:bg-cyan-500/20 transition"
                              title="Play Video"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                            <a
                              href={fileUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 hover:bg-indigo-500/20 transition"
                              title="Download Asset"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </>
                        )}

                        {/* Admin Override: Approve */}
                        {currentStatus !== 'Approved' && (
                          <button
                            disabled={actionLoading === row.id}
                            onClick={() => handleApprove(row.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition disabled:opacity-50"
                            title="Approve Video (Admin Override)"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Admin Delete */}
                        <button
                          disabled={actionLoading === row.id}
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50"
                          title="Delete from Firestore & Storage"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredVideos.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No videos match the search criteria.</p>
          )}
        </div>
      </section>

      {/* Aggregated Rollup by User */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white">Violations & Activity Rollup by Account</h2>
        <p className="mt-1 text-sm text-slate-400">Aggregated user statistics from `videos` Firestore collection.</p>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium">User Account</th>
                <th className="py-3 px-4 font-medium">Total Uploads</th>
                <th className="py-3 px-4 font-medium">Flagged Count</th>
                <th className="py-3 px-4 font-medium">Approved Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {byUser.map((row) => (
                <tr key={row.userId || row.userEmail} className="text-slate-200">
                  <td className="py-3 px-4 font-medium text-white">{row.userEmail || row.userId}</td>
                  <td className="py-3 px-4 text-slate-300">{row.totalVideos}</td>
                  <td className="py-3 px-4 text-rose-300 font-semibold">{row.flaggedCount}</td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold">{row.approvedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {byUser.length === 0 && <p className="py-6 text-center text-slate-500">No account activity recorded.</p>}
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
