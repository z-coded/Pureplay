import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingProfile, setPendingProfile] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSwitch = (profile) => {
    if (profile.type === 'child' && profile.pin) {
      setPendingProfile(profile)
      setPin('')
      setError('')
    } else {
      switchProfile(profile.id)
      setIsOpen(false)
    }
  }

  const confirmPin = () => {
    const result = switchProfile(pendingProfile.id, pin)
    if (result.success) {
      setPendingProfile(null)
      setIsOpen(false)
    } else {
      setError(result.error)
    }
  }

  if (profiles.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-300 transition-all"
      >
        <div className={`h-2 w-2 rounded-full ${activeProfile?.type === 'child' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        <span className="font-semibold">{activeProfile?.name || 'Select Profile'}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              className="absolute right-0 mt-2 z-50 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl backdrop-blur-2xl p-2"
            >
              {!pendingProfile ? (
                <div className="space-y-1">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Switch Profile</p>
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSwitch(profile)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                        activeProfile?.id === profile.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <User size={16} className={profile.type === 'child' ? 'text-amber-500' : 'text-emerald-600'} />
                        <div className="text-left">
                          <p className="text-sm font-semibold">{profile.name}</p>
                          <p className="text-[10px] opacity-70 uppercase font-mono">{profile.type}</p>
                        </div>
                      </div>
                      {activeProfile?.id === profile.id && <Check size={14} className="text-indigo-600" />}
                      {profile.type === 'child' && profile.pin && <Lock size={12} className="opacity-40" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="text-center">
                    <Lock className="mx-auto h-8 w-8 text-indigo-600 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">Enter Profile PIN</h3>
                    <p className="text-xs text-slate-500">Restricted access for {pendingProfile.name}</p>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center text-xl tracking-[1em] text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    placeholder="****"
                  />
                  {error && <p className="text-[10px] text-rose-600 text-center font-medium">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setPendingProfile(null)} className="btn-secondary flex-1 text-xs py-1.5">Cancel</button>
                    <button onClick={confirmPin} className="btn-primary flex-1 text-xs py-1.5">Verify</button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
