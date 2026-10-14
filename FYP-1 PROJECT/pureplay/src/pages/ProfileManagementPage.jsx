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
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center max-w-xl mx-auto shadow-sm">
        <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Guardian Authorization Required</h2>
        <p className="mt-2 text-slate-600 text-sm">
          Profile management and threshold policy authoring is restricted to verified guardian accounts.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 btn-primary"
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
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="h-7 w-7 text-indigo-600" />
              Family Profiles & Policy Tiers
            </h1>
            <span className="badge-slate font-mono text-[10px]">Policy Engine</span>
          </div>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm max-w-2xl">
            Configure individualized sensitivity thresholds for child, teen, and guardian accounts. Profiles dictate local AI blurring and audio suppression aggression.
          </p>
        </div>
      </section>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 shadow-2xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Profile Creator Form */}
        <section className="lg:col-span-6 glass-card rounded-2xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" />
                Create New Profile
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Author policy thresholds and maturity tiers</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Preset Templates
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('child')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  form.type === 'child'
                    ? 'border-rose-300 bg-rose-50 text-rose-700 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Child (Strict)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('teen')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  form.type === 'teen'
                    ? 'border-amber-300 bg-amber-50 text-amber-700 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Teen (Balanced)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('guardian')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  form.type === 'guardian'
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Guardian (Open)
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Profile Name
              </label>
              <input
                className="input-field text-xs sm:text-sm"
                placeholder="e.g. Alex, Sarah (Child), Junior"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Maturity Tier
              </label>
              <select
                className="input-field text-xs sm:text-sm cursor-pointer"
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="child">Child (Strict filtering + optional PIN lock)</option>
                <option value="teen">Teen (Balanced filtering)</option>
                <option value="guardian">Guardian Full Access (Unrestricted)</option>
              </select>
            </div>

            {form.type === 'child' && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                  <Lock className="h-3.5 w-3.5 text-rose-600" />
                  <span>Guardian Security PIN (Optional for Child Mode)</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  className="input-field text-xs font-mono"
                  placeholder="Enter 4-6 digit numeric PIN"
                  value={form.pin}
                  onChange={(e) => setForm((prev) => ({ ...prev, pin: e.target.value }))}
                />
                <p className="text-[11px] text-slate-500">
                  Required when switching out of this child profile back to guardian settings.
                </p>
              </div>
            )}

            {/* Threshold Sliders */}
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Sensitivity Calibration
              </span>

              {/* Nudity Slider */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <EyeOff className="h-3.5 w-3.5 text-rose-600" />
                    NSFW & Nudity Tolerance
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-600">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Strict Censor (5%)</span>
                  <span>Permissive (95%)</span>
                </div>
              </div>

              {/* Violence Slider */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-600" />
                    Graphic Violence Tolerance
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-600">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Strict (5%)</span>
                  <span>Permissive (95%)</span>
                </div>
              </div>

              {/* Profanity Slider */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <VolumeX className="h-3.5 w-3.5 text-indigo-600" />
                    Audio Profanity Tolerance
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600">
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>Strict Mute (5%)</span>
                  <span>Permissive (95%)</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-xs sm:text-sm"
            >
              Save Family Profile
            </button>
          </form>
        </section>

        {/* Managed Profiles List */}
        <section className="lg:col-span-6 glass-card rounded-2xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                Managed Profiles ({profiles.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Switch active viewing mode or remove profiles</p>
            </div>
          </div>

          <div className="space-y-3">
            {profiles.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No custom profiles yet</p>
                <p className="text-[11px] text-slate-500 mt-1">Use the authoring form to create your child and teen profiles.</p>
              </div>
            ) : (
              profiles.map((profile) => {
                const isActive = profile.id === activeProfileId
                return (
                  <article
                    key={profile.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isActive
                        ? 'border-indigo-300 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          profile.type === 'child' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          profile.type === 'teen' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{profile.name}</span>
                            <span className={
                              profile.type === 'child' ? 'badge-rose text-[10px]' :
                              profile.type === 'teen' ? 'badge-amber text-[10px]' :
                              'badge-indigo text-[10px]'
                            }>
                              {profile.type}
                            </span>
                            {profile.pin && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                                <Lock className="h-3 w-3 text-slate-400" /> PIN
                              </span>
                            )}
                          </div>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 mt-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" /> Active Enforcement
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSwitch(profile)}
                            className="btn-secondary text-xs py-1 px-2.5"
                          >
                            Set Active
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(profile.id, profile.name)}
                          title="Delete profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Policy meters */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>Nudity</span>
                          <span className="font-mono text-slate-700 font-semibold">{Math.round((profile.policy?.nudity ?? 0.8) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full"
                            style={{ width: `${Math.round((profile.policy?.nudity ?? 0.8) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>Violence</span>
                          <span className="font-mono text-slate-700 font-semibold">{Math.round((profile.policy?.violence ?? 0.7) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.round((profile.policy?.violence ?? 0.7) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span>Profanity</span>
                          <span className="font-mono text-slate-700 font-semibold">{Math.round((profile.policy?.profanity ?? 0.6) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-indigo-600 mb-2">
              <Lock className="h-6 w-6" />
              <h3 className="text-lg font-bold text-slate-900">Enter Profile PIN</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Profile "{activePinPrompt.name}" is protected by a guardian security PIN.
            </p>
            <form onSubmit={handleConfirmPin} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                autoFocus
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg tracking-widest text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePinPrompt(null)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2 text-xs"
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
