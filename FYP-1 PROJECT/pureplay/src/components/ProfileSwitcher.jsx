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
        className="flex items-center gap-2 rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
      >
        <div className={`h-2 w-2 rounded-full ${activeProfile?.type === 'child' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        <span>{activeProfile?.name || 'Select Profile'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 z-50 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2"
            >
              {!pendingProfile ? (
                <div className="space-y-1">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Switch Profile</p>
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSwitch(profile)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                        activeProfile?.id === profile.id ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <User size={16} className={profile.type === 'child' ? 'text-rose-400' : 'text-emerald-400'} />
                        <div className="text-left">
                          <p className="text-sm font-medium">{profile.name}</p>
                          <p className="text-[10px] opacity-60 uppercase">{profile.type}</p>
                        </div>
                      </div>
                      {activeProfile?.id === profile.id && <Check size={14} />}
                      {profile.type === 'child' && profile.pin && <Lock size={12} className="opacity-40" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="text-center">
                    <Lock className="mx-auto h-8 w-8 text-cyan-400 mb-2" />
                    <h3 className="text-sm font-bold text-white">Enter Profile PIN</h3>
                    <p className="text-xs text-slate-400">Restricted access for {pendingProfile.name}</p>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-xl tracking-[1em] focus:border-cyan-500 focus:outline-none"
                    placeholder="****"
                  />
                  {error && <p className="text-[10px] text-rose-500 text-center">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setPendingProfile(null)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700">Cancel</button>
                    <button onClick={confirmPin} className="flex-1 px-3 py-2 rounded-lg bg-cyan-600 text-xs text-white hover:bg-cyan-500">Verify</button>
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
