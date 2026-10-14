import { useState, useEffect, useMemo } from 'react'
import { onVideosSnapshot } from '../lib/adminStorage.js'
import { Play, Search, Film, CheckCircle, Shield, Sparkles } from 'lucide-react'
import VideoModal from '../components/VideoModal.jsx'
import { motion } from 'framer-motion'

function formatBytes(bytes) {
  if (!bytes) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function GalleryPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeVideo, setActiveVideo] = useState(null)

  useEffect(() => {
    const unsub = onVideosSnapshot((items) => {
      setVideos(items)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Module 6: Only videos with status === "Approved" are displayed
  const approvedVideos = useMemo(() => {
    return videos.filter((v) => v.status === 'Approved')
  }, [videos])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return approvedVideos
    return approvedVideos.filter(
      (v) =>
        (v.title && v.title.toLowerCase().includes(q)) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (v.file_name && v.file_name.toLowerCase().includes(q)),
    )
  }, [approvedVideos, query])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-cyan-400" />
            Approved Content Gallery (Module 6)
          </h1>
          <p className="mt-1 text-slate-400">
            Verified safe and approved media catalog. Free from profanity and adult violations.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search approved videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </section>

      {/* Grid of Approved Videos */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 text-center">
          <Film className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Approved Videos Yet</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            Videos uploaded to PurePlay that pass AI screening or receive Administrator Approval will appear in this catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 flex flex-col justify-between group shadow-lg"
            >
              {/* Video Thumbnail / Mock Player View */}
              <div
                className="relative aspect-video w-full bg-slate-950 flex items-center justify-center cursor-pointer group-hover:brightness-110 transition"
                onClick={() => setActiveVideo(video)}
              >
                <div className="h-14 w-14 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/30 transition shadow-lg">
                  <Play className="h-7 w-7 fill-cyan-400" />
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 backdrop-blur-md">
                  <CheckCircle className="h-3 w-3" />
                  <span>Approved Safe</span>
                </div>
              </div>

              {/* Video Meta Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-base truncate" title={video.title || video.file_name}>
                    {video.title || video.file_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {video.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">{formatBytes(video.file_size)}</span>
                  <span>{video.uploaded_at ? new Date(video.uploaded_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Modal Player */}
      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.download_url || activeVideo?.fileUrl}
        title={activeVideo?.title || activeVideo?.file_name}
      />
    </div>
  )
}

export default GalleryPage
