import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Shield,
  Sliders,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Flame,
  VolumeX,
  Sparkles,
  UserCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

function ProfileManagementPage() {
  const { role, profiles, createProfile, deleteProfile, activeProfileId, switchProfile } = useAuth()
  const [form, setForm] = useState({
    name: '',
    type: 'child',
    pin: '',
    nudity: 0.25,
    violence: 0.3,
    profanity: 0.35,
  })
  const [saveSuccess, setSaveSuccess] = useState('')
  const [activePinPrompt, setActivePinPrompt] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')

  if (role !== 'guardian') {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center max-w-xl mx-auto backdrop-blur-xl">
        <Shield className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white">Guardian Authorization Required</h2>
        <p className="mt-2 text-slate-400 text-sm">
          Profile management and threshold policy authoring is restricted to verified guardian accounts.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const applyPreset = (preset) => {
    if (preset === 'child') {
      setForm((prev) => ({
        ...prev,
        type: 'child',
        nudity: 0.2,
        violence: 0.25,
        profanity: 0.3,
      }))
    } else if (preset === 'teen') {
      setForm((prev) => ({
        ...prev,
        type: 'teen',
        pin: '',
        nudity: 0.55,
        violence: 0.6,
        profanity: 0.65,
      }))
    } else if (preset === 'guardian') {
      setForm((prev) => ({
        ...prev,
        type: 'guardian',
        pin: '',
        nudity: 0.85,
        violence: 0.85,
        profanity: 0.9,
      }))
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return

    createProfile({
      name: form.name.trim(),
      type: form.type,
      pin: form.type === 'child' ? form.pin : '',
      policy: {
        nudity: Number(form.nudity),
        violence: Number(form.violence),
        profanity: Number(form.profanity),
      },
    })

    setSaveSuccess(`Profile "${form.name}" created successfully with custom policies!`)
    setForm({
      name: '',
      type: 'child',
      pin: '',
      nudity: 0.25,
      violence: 0.3,
      profanity: 0.35,
    })
    setTimeout(() => setSaveSuccess(''), 4000)
  }

  const handleSwitch = (profile) => {
    if (profile.type === 'child' && profile.pin) {
      setActivePinPrompt(profile)
      setPinInput('')
      setPinError('')
    } else {
      switchProfile(profile.id)
    }
  }

  const handleConfirmPin = (e) => {
    e.preventDefault()
    if (!activePinPrompt) return
    const res = switchProfile(activePinPrompt.id, pinInput)
    if (!res.success) {
      setPinError('Incorrect security PIN. Please try again.')
    } else {
      setActivePinPrompt(null)
      setPinInput('')
      setPinError('')
    }
  }

  const handleDelete = (profileId, name) => {
    if (window.confirm(`Are you sure you want to delete profile "${name}"?`)) {
      deleteProfile(profileId)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-cyan-400" />
          Family Profile & Policy Management
        </h1>
        <p className="mt-2 text-slate-400 max-w-2xl">
          Configure individualized sensitivity thresholds for child, teen, and guardian members. Each profile governs AI censorship aggression and upload permissions.
        </p>
      </div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300 backdrop-blur-md"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Profile Creator Form */}
        <section className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                Create New Profile
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Author policy thresholds and maturity tiers</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Select Preset Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('child')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  form.type === 'child'
                    ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                Child (Strict)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('teen')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  form.type === 'teen'
                    ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                Teen (Moderate)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('guardian')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  form.type === 'guardian'
                    ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                Guardian (Open)
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={submit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Profile Name
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="e.g. Alex, Sarah (Child), Junior"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Maturity Tier
              </label>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="child">Child (Restricted uploads + PIN protection)</option>
                <option value="teen">Teen (Balanced filtering)</option>
                <option value="guardian">Guardian Full Access (Unrestricted)</option>
              </select>
            </div>

            {form.type === 'child' && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <Lock className="h-4 w-4" />
                  <span>Guardian Security PIN (Optional for Child Mode)</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter 4-6 digit numeric PIN"
                  value={form.pin}
                  onChange={(e) => setForm((prev) => ({ ...prev, pin: e.target.value }))}
                />
                <p className="text-[11px] text-slate-400">
                  Required when switching out of this child profile back to guardian settings.
                </p>
              </div>
            )}

            {/* Threshold Sliders */}
            <div className="space-y-4 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Policy Threshold Calibration
              </span>

              {/* Nudity Slider */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5 text-rose-400" />
                    NSFW & Nudity Tolerance
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {Math.round(form.nudity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={form.nudity}
                  onChange={(e) => setForm((prev) => ({ ...prev, nudity: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Strict Censor (5%)</span>
                  <span>Permissive (95%)</span>
                </div>
              </div>

              {/* Violence Slider */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    Graphic Violence Tolerance
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {Math.round(form.violence * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={form.violence}
                  onChange={(e) => setForm((prev) => ({ ...prev, violence: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Strict (5%)</span>
                  <span>Permissive (95%)</span>
                </div>
              </div>

              {/* Profanity Slider */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <VolumeX className="h-3.5 w-3.5 text-cyan-400" />
                    Audio Profanity Tolerance
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {Math.round(form.profanity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={form.profanity}
                  onChange={(e) => setForm((prev) => ({ ...prev, profanity: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Strict Mute (5%)</span>
                  <span>Permissive (95%)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition"
            >
              Save Family Profile
            </button>
          </form>
        </section>

        {/* Managed Profiles List */}
        <section className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                Managed Profiles ({profiles.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Switch active viewing mode or remove profiles</p>
            </div>
          </div>

          <div className="space-y-4">
            {profiles.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
                <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No custom profiles yet</p>
                <p className="text-xs text-slate-500 mt-1">Use the authoring form to create your child and teen profiles.</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const isActive = profile.id === activeProfileId
                const typeColors = {
                  child: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                  teen: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  guardian: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
                }

                return (
                  <article
                    key={profile.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      isActive
                        ? 'border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-base ${
                          profile.type === 'child' ? 'bg-rose-500/20 text-rose-400' :
                          profile.type === 'teen' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{profile.name}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${typeColors[profile.type] || typeColors.child}`}>
                              {profile.type}
                            </span>
                            {profile.pin && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Lock className="h-3 w-3 text-slate-500" /> PIN
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 mt-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Currently Active Enforcement
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSwitch(profile)}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                          >
                            Set Active
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(profile.id, profile.name)}
                          title="Delete profile"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Policy meters */}
                    <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Nudity</span>
                          <span className="font-mono text-slate-300">{Math.round((profile.policy?.nudity ?? 0.8) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full"
                            style={{ width: `${Math.round((profile.policy?.nudity ?? 0.8) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Violence</span>
                          <span className="font-mono text-slate-300">{Math.round((profile.policy?.violence ?? 0.7) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${Math.round((profile.policy?.violence ?? 0.7) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span>Profanity</span>
                          <span className="font-mono text-slate-300">{Math.round((profile.policy?.profanity ?? 0.6) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.round((profile.policy?.profanity ?? 0.6) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </div>

      {/* PIN Prompt Modal */}
      {activePinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-cyan-400 mb-2">
              <Lock className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Enter Profile PIN</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Profile "{activePinPrompt.name}" is protected by a guardian security PIN.
            </p>
            <form onSubmit={handleConfirmPin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-lg tracking-widest text-white focus:border-cyan-500 focus:outline-none"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePinPrompt(null)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                >
                  Unlock & Switch
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ProfileManagementPage
