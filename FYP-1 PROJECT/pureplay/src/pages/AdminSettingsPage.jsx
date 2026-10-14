import { useEffect, useState } from 'react'
import { getGlobalModerationSettings, saveGlobalModerationSettings } from '../lib/adminStorage.js'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, SlidersHorizontal, Loader2, EyeOff, VolumeX, RotateCcw, CheckCircle2, Shield, Info, Sparkles } from 'lucide-react'

const DEFAULT_SETTINGS = { nsfwThreshold: 0.72, profanityThreshold: 0.58 }

function AdminSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [savedToast, setSavedToast] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const data = await getGlobalModerationSettings()
      setSettings(data)
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const update = async (patch, label = 'Settings updated') => {
    const next = { ...settings, ...patch }
    setSettings(next)
    await saveGlobalModerationSettings(next)
    setSavedToast(label)
    setTimeout(() => setSavedToast(''), 3000)
  }

  const applyPreset = (preset) => {
    if (preset === 'strict') {
      update({ nsfwThreshold: 0.35, profanityThreshold: 0.35 }, 'Applied Strict Defense Policy (35% threshold)')
    } else if (preset === 'balanced') {
      update({ nsfwThreshold: 0.72, profanityThreshold: 0.58 }, 'Applied Balanced Standard Policy')
    } else if (preset === 'permissive') {
      update({ nsfwThreshold: 0.9, profanityThreshold: 0.85 }, 'Applied Permissive Review Policy (90% threshold)')
    }
  }

  const handleReset = () => {
    update(DEFAULT_SETTINGS, 'Reset to baseline defaults')
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-cyan-500">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading secure configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl"
    >
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Settings className="text-cyan-400 h-8 w-8" />
            Global Moderation Policy
          </h1>
          <p className="mt-2 text-slate-400 text-base">
            Configure baseline AI confidence thresholds. These global parameters dictate how aggressively the shared pipeline flags content before individual profile restrictions apply.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </section>

      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-300 backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span>{savedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset Buttons */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
          Global Sensitivity Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => applyPreset('strict')}
            className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition"
          >
            <p className="text-xs font-bold text-rose-300">Strict Defense</p>
            <p className="text-[11px] text-slate-400 mt-1">Aggressive visual censorship and sensitive speech muting</p>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-left transition"
          >
            <p className="text-xs font-bold text-cyan-300">Balanced Standard</p>
            <p className="text-[11px] text-slate-400 mt-1">Production recommended: 72% visual, 58% profanity</p>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('permissive')}
            className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition"
          >
            <p className="text-xs font-bold text-amber-300">Permissive Review</p>
            <p className="text-[11px] text-slate-400 mt-1">Flags only high-confidence explicit visual sequences</p>
          </button>
        </div>
      </section>

      <section className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
            <SlidersHorizontal className="h-6 w-6 text-indigo-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Threshold Calibration</h2>
              <p className="text-xs text-slate-400 mt-1">Higher values require stronger model confidence to trigger censorship.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
              <label className="block">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                      <EyeOff className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-200 block">NSFW (Visual Content)</span>
                      <span className="text-xs text-slate-500">NudeNet 18-class boundary box and classification threshold</span>
                    </div>
                  </div>
                  <span className="text-base font-bold tabular-nums text-cyan-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
                    {Math.round(settings.nsfwThreshold * 100)}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  value={settings.nsfwThreshold}
                  onChange={(e) => update({ nsfwThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
                  <span>Strict Censor (10%)</span>
                  <span>Permissive (99%)</span>
                </div>
              </label>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
              <label className="block">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <VolumeX className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-200 block">Profanity (Audio Track)</span>
                      <span className="text-xs text-slate-500">Audio stream bleeping and suppression sensitivity</span>
                    </div>
                  </div>
                  <span className="text-base font-bold tabular-nums text-cyan-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
                    {Math.round(settings.profanityThreshold * 100)}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  value={settings.profanityThreshold}
                  onChange={(e) => update({ profanityThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-xs text-slate-500 font-mono mt-2">
                  <span>Strict Mute (10%)</span>
                  <span>Permissive (99%)</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}

export default AdminSettingsPage
