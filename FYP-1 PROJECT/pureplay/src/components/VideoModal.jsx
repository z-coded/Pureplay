import { useState, useEffect } from 'react'
import { X, ShieldCheck, CheckCircle2, Eye, EyeOff, Download, Trash2, ShieldAlert } from 'lucide-react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { playbackVerdict, moderationStatus } from '../lib/moderationVerdict.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title,
  onDelete,
  rawUrl,
  censoredUrl,
  aiAnalysis,
  videoData,
}) {
  const [streamMode, setStreamMode] = useState('censored') // 'censored' | 'raw'
  const { activeProfile } = useAuth()

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

  const hasDualStreams = Boolean(rawUrl && censoredUrl && rawUrl !== censoredUrl)
  const targetRaw = rawUrl || videoUrl
  const targetCensored = censoredUrl || videoUrl

  const activeUrl = hasDualStreams
    ? (streamMode === 'censored' ? targetCensored : targetRaw)
    : (videoUrl || targetCensored || '/sample_demo.mp4')

  const analysis = aiAnalysis || videoData?.ai_analysis
  const verdict = playbackVerdict(analysis)
  if (activeProfile?.type !== 'guardian' && analysis?.review_required && videoData?.status !== 'Approved') {
    verdict.canPlay = false
    verdict.reason = 'A guardian must review this filtered video first.'
  }
  const isSafe = moderationStatus(analysis) === 'Approved'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          {/* Backdrop overlay - clicking closes modal */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm cursor-pointer"
            title="Click outside to close"
          />

          {/* Modal Container */}
          <Motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl my-auto"
          >
            {/* Header with Title, Mode Switcher, and Close button */}
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs px-4 sm:px-5 py-2.5 sm:py-3 shrink-0">
              <div className="flex items-center gap-2 truncate pr-2 max-w-[50%] sm:max-w-[60%]">
                {isSafe ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                )}
                <div className="truncate">
                  <h3 className="font-bold text-slate-900 truncate text-xs sm:text-sm md:text-base">
                    {title || 'PurePlay Video Inspection Player'}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] mt-0.5">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {verdict.label}
                    </span>
                    <span className="text-slate-500 hidden sm:inline">
                      Automated analysis; guardian review recommended
                    </span>
                  </div>
                </div>
              </div>

              {/* Stream Switcher, Download & Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                {hasDualStreams && verdict.canPlay ? (
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
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{verdict.label}</span>
                  </div>
                )}

                <a
                  href={verdict.canPlay ? activeUrl : undefined}
                  download="pureplay_video.mp4"
                  className="hidden xs:flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 hover:text-indigo-600 font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-xs"
                  title="Download MP4"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                {onDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-rose-200 bg-rose-50/80 hover:bg-rose-100 transition-colors shadow-xs"
                    title="Delete Video"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}

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

            {/* Video Player Area - Clean real video output without artificial full-screen CSS blur */}
            <div className="w-full bg-slate-950 relative flex items-center justify-center overflow-hidden max-h-[55vh] sm:max-h-[62vh]">
              {verdict.canPlay ? <video
                key={`${activeUrl}_${streamMode}`}
                src={activeUrl}
                controls
                autoPlay
                className="max-h-[55vh] sm:max-h-[62vh] w-full object-contain"
              >
                Your browser does not support HTML5 video.
              </video> : (
                <div className="p-10 text-center text-white">
                  <ShieldAlert className="mx-auto mb-3 h-8 w-8" />
                  <p className="font-bold">{verdict.label}</p>
                  <p className="mt-2 text-sm">{verdict.reason}</p>
                </div>
              )}
            </div>

            {/* Real-Time Telemetry Bar */}
            <div className="border-t border-slate-200 bg-white px-3 sm:px-5 py-2.5 shrink-0">
              {analysis?.decision === 'FILTERED_REVIEW_REQUIRED' && (
                <div className="mb-2 text-xs text-slate-600">
                  <p>{Number(analysis.removed_seconds || 0).toFixed(1)} seconds removed.
                    {' '}Review the full edited video before approving it for your child.</p>
                  <details className="mt-1">
                    <summary className="cursor-pointer">Removed scenes and detection limits</summary>
                    <ul className="mt-2 list-disc pl-4">
                      {(analysis.removed_intervals || []).map((interval, index) => (
                        <li key={index}>{interval.start.toFixed(1)}–{interval.end.toFixed(1)}s in original:
                          {' '}{interval.reasons.join(', ')}</li>
                      ))}
                      {(analysis.warnings || []).map((warning) => <li key={warning}>{warning}</li>)}
                    </ul>
                  </details>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs">
                {isSafe ? (
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px] sm:text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>No violations detected in sampled content</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-[11px] sm:text-xs">
                    <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>{verdict.label}</span>
                  </div>
                )}
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500">
                  Automated results are not a safety guarantee
                </span>
              </div>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
