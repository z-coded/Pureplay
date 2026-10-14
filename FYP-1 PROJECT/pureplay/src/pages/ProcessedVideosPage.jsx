import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldCheck, EyeOff, VolumeX, Info, Play, Download } from 'lucide-react'
import VideoModal from '../components/VideoModal.jsx'

function ProcessedVideosPage() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  // Mock moderation data for the heatmap
  const timelineData = [
    { start: 0, end: 15, type: 'safe' },
    { start: 15, end: 18, type: 'nsfw', label: 'Explicit Content', confidence: 0.94 },
    { start: 18, end: 45, type: 'safe' },
    { start: 45, end: 50, type: 'profanity', label: 'Severe Profanity', confidence: 0.88 },
    { start: 50, end: 85, type: 'safe' },
    { start: 85, end: 92, type: 'nsfw', label: 'Suggestive Imagery', confidence: 0.72 },
    { start: 92, end: 100, type: 'safe' },
  ]

  const events = timelineData.filter(d => d.type !== 'safe')

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="text-emerald-400 h-8 w-8" />
          Explainable AI Moderation Report
        </h1>
        <p className="mt-2 text-slate-400">
          Visualizing detection confidence and censorship triggers across the media timeline.
        </p>
      </section>

      {/* Heatmap Timeline */}
      <section className="glass-card rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Interactive Heatmap</h2>
        <div className="relative h-12 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {timelineData.map((segment, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{ width: `${segment.end - segment.start}%` }}
              className={`h-full cursor-pointer transition-brightness hover:brightness-125 ${
                segment.type === 'nsfw' ? 'bg-rose-500' : 
                segment.type === 'profanity' ? 'bg-amber-500' : 'bg-emerald-500/20'
              }`}
              onMouseEnter={() => segment.type !== 'safe' && setSelectedEvent(segment)}
            />
          ))}
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-500 font-mono">
          <span>00:00</span>
          <span>05:00</span>
          <span>10:00</span>
        </div>

        {/* Event Details Card */}
        <div className="mt-8 h-32 relative">
          <AnimatePresence mode="wait">
            {selectedEvent ? (
              <motion.div
                key={selectedEvent.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-0 rounded-xl bg-slate-800/50 border border-slate-700 p-4 flex items-center gap-4"
              >
                <div className={`p-3 rounded-lg ${selectedEvent.type === 'nsfw' ? 'bg-rose-500/20' : 'bg-amber-500/20'}`}>
                  {selectedEvent.type === 'nsfw' ? <EyeOff className="text-rose-400" /> : <VolumeX className="text-amber-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedEvent.label}</h3>
                  <p className="text-sm text-slate-400">
                    Detected at {Math.floor(selectedEvent.start)}% of timeline • Confidence: {(selectedEvent.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-300">Auto-Blurred</span>
                  <span className="px-3 py-1 rounded-full bg-slate-700 text-xs text-slate-300">Action: Redacted</span>
                </div>
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <Info className="h-4 w-4 mr-2" />
                Hover over the timeline to view detection details
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Detection Breakdown</h2>
          <div className="space-y-4">
            {events.map((event, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={event.type === 'nsfw' ? 'text-rose-500' : 'text-amber-500'} size={18} />
                  <span className="text-slate-200">{event.label}</span>
                </div>
                <span className="text-xs font-mono text-slate-500">{event.start}% - {event.end}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6 bg-gradient-to-br from-cyan-900/20 to-transparent">
          <h2 className="text-xl font-semibold text-white mb-2">Censorship Actions</h2>
          <p className="text-sm text-slate-400 mb-6">Summary of filters applied based on current profile policy.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Frames Blurred</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700">
              <p className="text-2xl font-bold text-white">04</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Audio Mutes</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button 
              onClick={() => setIsVideoOpen(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" /> Play Video
            </button>
            <button className="flex-1 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2">
              <Download className="h-4 w-4" /> Download
            </button>
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
