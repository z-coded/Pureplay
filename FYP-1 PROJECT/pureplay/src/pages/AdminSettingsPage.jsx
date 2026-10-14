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
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-medium animate-pulse text-slate-600">Loading secure configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-4xl"
    >
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Settings className="text-purple-700 h-7 w-7" />
              Global Moderation Policy
            </h1>
            <span className="badge-slate font-mono text-[10px]">Baseline Tuning</span>
          </div>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Calibrate baseline AI confidence thresholds. These parameters govern automated visual blurring and audio suppression across all accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start btn-secondary text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </section>

      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{savedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset Buttons */}
      <section className="glass-card rounded-2xl p-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
          Sensitivity Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => applyPreset('strict')}
            className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-left transition shadow-2xs"
          >
            <p className="text-xs font-bold text-rose-800">Strict Defense</p>
            <p className="text-[11px] text-slate-500 mt-1">Aggressive visual censorship and sensitive speech muting</p>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition shadow-2xs"
          >
            <p className="text-xs font-bold text-indigo-800">Balanced Standard</p>
            <p className="text-[11px] text-slate-500 mt-1">Recommended: 72% visual threshold, 58% profanity</p>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('permissive')}
            className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left transition shadow-2xs"
          >
            <p className="text-xs font-bold text-amber-800">Permissive Review</p>
            <p className="text-[11px] text-slate-500 mt-1">Flags only high-confidence explicit sequences</p>
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 sm:p-7 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-200">
            <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Threshold Calibration</h2>
              <p className="text-xs text-slate-500 mt-0.5">Higher values require stronger model confidence to trigger censorship.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <label className="block">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                      <EyeOff className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">NSFW (Visual Content)</span>
                      <span className="text-[11px] text-slate-500">NudeNet 18-class boundary box and classification threshold</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-indigo-700 bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono shadow-2xs">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
                  <span>Strict Censor (10%)</span>
                  <span>Permissive (99%)</span>
                </div>
              </label>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <label className="block">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                      <VolumeX className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">Profanity (Audio Stream)</span>
                      <span className="text-[11px] text-slate-500">Audio stream bleeping and suppression sensitivity</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-indigo-700 bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono shadow-2xs">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
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
