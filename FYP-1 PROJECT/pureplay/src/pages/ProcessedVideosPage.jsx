import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldCheck, EyeOff, VolumeX, Info, Play, Download, Sparkles, Sliders, Layers } from 'lucide-react'
import VideoModal from '../components/VideoModal.jsx'

function ProcessedVideosPage() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  // Explainable AI timeline data
  const timelineData = [
    { start: 0, end: 15, type: 'safe', label: 'Safe Visual & Audio Sequence', confidence: 0.99 },
    { start: 15, end: 18, type: 'nsfw', label: 'Suggestive Visual Pose', confidence: 0.94, action: '51×51 Gaussian Blur Applied' },
    { start: 18, end: 45, type: 'safe', label: 'Safe Content Stream', confidence: 0.98 },
    { start: 45, end: 50, type: 'profanity', label: 'Expletive Detected in Audio', confidence: 0.88, action: '1000 Hz Tone Mute Injected' },
    { start: 50, end: 85, type: 'safe', label: 'Verified Compliant', confidence: 0.99 },
    { start: 85, end: 92, type: 'nsfw', label: 'Borderline Exposure', confidence: 0.76, action: 'Region Blurring Enforced' },
    { start: 92, end: 100, type: 'safe', label: 'Safe Outro', confidence: 0.99 },
  ]

  const events = timelineData.filter((d) => d.type !== 'safe')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-400 h-7 w-7" />
              Explainable AI Moderation Report
            </h1>
            <span className="badge-cyan text-[11px] font-mono">XAI Pipeline</span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Transparent detection telemetry, confidence thresholds, and dynamic censorship triggers across media timestamps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setIsVideoOpen(true)}
            className="btn-primary text-xs"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>Play Moderated Output</span>
          </button>
        </div>
      </section>

      {/* Heatmap Timeline Card */}
      <section className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Interactive Multi-Modal Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover over colored timeline zones to view model telemetry and applied censorship actions.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Safe Stream
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> NudeNet Blur
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Whisper Mute
            </span>
          </div>
        </div>

        {/* Heatmap Bar */}
        <div className="relative h-12 w-full bg-slate-950/80 rounded-xl overflow-hidden flex border border-white/[0.08] p-1">
          {timelineData.map((segment, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleY: 0.8 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{ width: `${segment.end - segment.start}%` }}
              className={`h-full cursor-pointer rounded-lg transition-all mx-0.5 ${
                segment.type === 'nsfw'
                  ? 'bg-rose-500/80 hover:bg-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                  : segment.type === 'profanity'
                  ? 'bg-amber-500/80 hover:bg-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/30'
              }`}
              onMouseEnter={() => setSelectedEvent(segment)}
            />
          ))}
        </div>

        {/* Timestamp Track Markers */}
        <div className="mt-2.5 flex justify-between text-[11px] text-slate-500 font-mono px-1">
          <span>00:00</span>
          <span>02:30</span>
          <span>05:00</span>
          <span>07:30</span>
          <span>10:00</span>
        </div>

        {/* Dynamic Telemetry Inspection Panel */}
        <div className="mt-6 min-h-[96px] relative">
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.label + selectedEvent.start}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl bg-slate-950/70 border border-white/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      selectedEvent.type === 'nsfw'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : selectedEvent.type === 'profanity'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {selectedEvent.type === 'nsfw' ? (
                      <EyeOff className="h-5 w-5" />
                    ) : selectedEvent.type === 'profanity' ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{selectedEvent.label}</h3>
                      <span className="badge-slate text-[10px] font-mono">
                        {selectedEvent.start}% – {selectedEvent.end}% timeline
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Model Confidence: <span className="text-white font-semibold font-mono">{(selectedEvent.confidence * 100).toFixed(0)}%</span>
                      {selectedEvent.action && ` • Enforcement: ${selectedEvent.action}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={
                      selectedEvent.type === 'nsfw'
                        ? 'badge-rose'
                        : selectedEvent.type === 'profanity'
                        ? 'badge-amber'
                        : 'badge-emerald'
                    }
                  >
                    {selectedEvent.type === 'safe' ? 'Compliant' : 'Censorship Applied'}
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.08] bg-slate-950/30 p-6 flex items-center justify-center text-slate-500 text-xs">
                <Info className="h-4 w-4 mr-2 text-cyan-400" />
                <span>Hover over any timeline segment above to inspect detection confidence, class labels, and blur triggers.</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Two-Column Telemetry Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Detection Breakdown */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Detected Trigger Incidents
            </h2>
            <span className="badge-slate text-[10px] font-mono">{events.length} Flags</span>
          </div>

          <div className="space-y-2.5">
            {events.map((event, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-white/[0.05] hover:border-white/[0.1] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      event.type === 'nsfw' ? 'bg-rose-400 shadow-[0_0_6px_#f43f5e]' : 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                    }`}
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-200 block">{event.label}</span>
                    <span className="text-[11px] text-slate-400">{event.action}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {(event.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="block text-[10px] font-mono text-slate-500">
                    {event.start}% - {event.end}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Censorship Stats & Output */}
        <section className="glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Censorship Transformations
              </h2>
              <span className="badge-emerald text-[10px]">Verified Output</span>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Summary of video redaction operations executed by PurePlay's media processing pipeline prior to saving.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <div className="text-2xl font-black text-white font-mono">12</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Frames Blurred</div>
                <div className="text-[10px] text-slate-500 mt-0.5">51×51 Gaussian filter</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/[0.06]">
                <div className="text-2xl font-black text-white font-mono">04</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Audio Mutes</div>
                <div className="text-[10px] text-slate-500 mt-0.5">1000 Hz tone suppression</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsVideoOpen(true)}
              className="btn-primary flex-1 text-xs"
            >
              <Play className="h-3.5 w-3.5 fill-white" /> Preview Filtered Output
            </button>
            <a
              href="https://www.w3schools.com/html/mov_bbb.mp4"
              download="moderated_output.mp4"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </div>
        </section>
      </div>

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl="https://www.w3schools.com/html/mov_bbb.mp4"
        title="Moderated Output Demo"
      />
    </div>
  )
}

export default ProcessedVideosPage
