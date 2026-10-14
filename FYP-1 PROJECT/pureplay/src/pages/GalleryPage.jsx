import { useState, useEffect, useMemo } from 'react'
import { onVideosSnapshot } from '../lib/adminStorage.js'
import { Play, Search, Film, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react'
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
    let unsub = () => {}
    try {
      unsub = onVideosSnapshot((items) => {
        setVideos(items || [])
        setLoading(false)
      })
    } catch (err) {
      console.error('Error attaching gallery listener:', err)
      setLoading(false)
    }

    const timer = setTimeout(() => setLoading(false), 1200)

    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [])

  // Only videos with status === "Approved" are displayed
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
      <div className="flex h-72 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="text-xs text-slate-500 font-medium">Loading safe media library...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Film className="h-7 w-7 text-indigo-600" />
              Safe Media Gallery
            </h1>
            <span className="badge-emerald text-[11px] font-mono">Curated Vault</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Verified child-safe video catalog thoroughly inspected by PurePlay AI engines.
          </p>
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search approved titles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-10 pr-4 text-xs sm:text-sm"
          />
        </div>
      </section>

      {/* Grid of Approved Videos */}
      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-300 text-center px-4 bg-slate-50">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4 text-slate-400">
            <Film className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Approved Media in Library</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500">
            Videos uploaded through PurePlay that pass AI screening or receive Administrator Approval will appear automatically in this safe catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group"
            >
              {/* Video Thumbnail / Clean Player Trigger */}
              <div
                className="relative aspect-video w-full bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => setActiveVideo(video)}
              >
                {/* Subtle dark backdrop pattern */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent z-10" />
                
                {/* Play Button */}
                <div className="relative z-20 h-13 w-13 rounded-full bg-white/90 border border-white/80 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-white transition-all duration-300 shadow-xl backdrop-blur-sm">
                  <Play className="h-6 w-6 fill-indigo-600 ml-0.5" />
                </div>

                {/* Safe Status Badge */}
                <div className="absolute top-3 left-3 z-20">
                  <span className="badge-emerald text-[11px] shadow-xs">
                    <CheckCircle className="h-3 w-3" />
                    <span>Safe for All Ages</span>
                  </span>
                </div>

                {/* File size pill */}
                {video.file_size && (
                  <div className="absolute bottom-3 right-3 z-20">
                    <span className="badge-slate text-[10px] font-mono shadow-xs">
                      {formatBytes(video.file_size)}
                    </span>
                  </div>
                )}
              </div>

              {/* Video Meta Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors" title={video.title || video.file_name}>
                    {video.title || video.file_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {video.description || 'Verified family content cleared by PurePlay multi-layer detection filters.'}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                    <span>NudeNet Checked</span>
                  </span>
                  <span className="font-mono text-slate-500">
                    {video.uploaded_at ? new Date(video.uploaded_at).toLocaleDateString() : 'Active'}
                  </span>
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
