import { useState, useEffect } from 'react'
import { X, ShieldCheck, Eye, EyeOff, VolumeX, Sparkles, AlertTriangle, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function VideoModal({ isOpen, onClose, videoUrl, title }) {
  const [streamMode, setStreamMode] = useState('censored') // 'censored' | 'raw'

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          {/* Backdrop overlay - clicking closes modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm cursor-pointer"
            title="Click outside to close"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl my-auto"
          >
            {/* Header with Title, Mode Switcher, and Close button */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs px-4 sm:px-5 py-2.5 sm:py-3 shrink-0">
              <div className="flex items-center gap-2 truncate pr-2 max-w-[45%] sm:max-w-[55%]">
                <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                <h3 className="font-bold text-slate-900 truncate text-xs sm:text-sm md:text-base">
                  {title || 'PurePlay Video Inspection Player'}
                </h3>
              </div>

              {/* Interactive Stream Switcher, Download & Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 sm:p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStreamMode('censored')}
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
                      streamMode === 'censored'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <EyeOff className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span>Censored</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStreamMode('raw')}
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all ${
                      streamMode === 'raw'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span>Raw</span>
                  </button>
                </div>

                <a
                  href={activeUrl}
                  download={streamMode === 'censored' ? 'demo_censored_child_safe.mp4' : 'demo_raw_unfiltered.mp4'}
                  className="hidden xs:flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 hover:text-indigo-600 font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                  title="Download MP4"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                {/* Primary Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors shrink-0 flex items-center justify-center bg-slate-100 border border-slate-200"
                  title="Close (Esc)"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Video Player Area with height constraints */}
            <div className="w-full bg-slate-950 relative flex items-center justify-center overflow-hidden max-h-[50vh] sm:max-h-[58vh]">
              <video
                key={activeUrl}
                src={activeUrl}
                controls
                autoPlay
                className="max-h-[50vh] sm:max-h-[58vh] w-full object-contain"
              >
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Real-Time Telemetry Bar */}
            <div className="border-t border-slate-200 bg-white px-3 sm:px-5 py-2.5 shrink-0">
              {streamMode === 'censored' ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px] sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>51×51 Gaussian Blur + Voice Muted & 1000 Hz FCC Censor Bleep Active</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-500">
                    Violation at 00:06–00:10 sanitized • Compliant for ages 6+
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-700 font-semibold text-[11px] sm:text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>Unfiltered Stream: Shows explicit visual violation and raw speech</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-rose-600">
                    Flagged at 00:06–00:10: Profanity 96.8% (Detoxify) • Visual Target (OpenNSFW2)
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
