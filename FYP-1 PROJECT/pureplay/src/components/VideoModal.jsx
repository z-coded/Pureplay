import { useState } from 'react'
import { X, ShieldCheck, Eye, EyeOff, VolumeX, Sparkles, AlertTriangle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VideoModal({ isOpen, onClose, videoUrl, title }) {
  const [streamMode, setStreamMode] = useState('censored') // 'censored' | 'raw'

  // If a specific URL is provided, fallback to demo files for comparison
  const activeUrl =
    streamMode === 'censored'
      ? videoUrl && !videoUrl.includes('raw')
        ? videoUrl
        : '/demo_censored_child_safe.mp4'
      : '/demo_raw_unfiltered.mp4'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Header with Title and Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3.5">
              <div className="flex items-center gap-2.5 truncate pr-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                  {title || 'PurePlay Video Inspection Player'}
                </h3>
              </div>

              {/* Interactive Stream Switcher & Download */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStreamMode('censored')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      streamMode === 'censored'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Child-Safe (Censored)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStreamMode('raw')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      streamMode === 'raw'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Raw (Uncensored)</span>
                  </button>
                </div>

                <a
                  href={activeUrl}
                  download={streamMode === 'censored' ? 'demo_censored_child_safe.mp4' : 'demo_raw_unfiltered.mp4'}
                  className="flex items-center gap-1 text-xs text-slate-700 hover:text-indigo-600 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                  title="Download this MP4 file to test in local video player"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>

              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full bg-slate-950 relative">
              <video
                key={activeUrl}
                src={activeUrl}
                controls
                autoPlay
                className="h-full w-full object-contain"
              >
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Real-Time Telemetry Bar */}
            <div className="border-t border-slate-200 bg-white px-5 py-3">
              {streamMode === 'censored' ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>51×51 Gaussian Blur + Voice Muted & 1000 Hz FCC Censor Bleep Active</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Violation at 00:06–00:10 sanitized • Voice muted & bleeped + Gaussian blur • Ages 6+
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-700 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Unfiltered Stream: Shows explicit visual violation and raw speech</span>
                  </div>
                  <span className="text-[11px] font-mono text-rose-600">
                    Flagged at 00:06–00:10: Profanity 96.8% (Detoxify) • Sensitive Visual Target (OpenNSFW2)
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
