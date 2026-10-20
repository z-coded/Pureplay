import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config.js'
import { defaultPolicy } from '../data/mockData.js'
import { ensureUserDocument } from '../lib/adminStorage.js'
import { activeKey, createSessionLoader, emptySession, normalizeProfiles, profileKey } from '../lib/accountSession.js'

const AuthContext = createContext(null)

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => ({ ...emptySession(), loading: true }))
  const { user, profiles, activeProfileId, loading } = session

  useEffect(() => {
    const loader = createSessionLoader({
      storage: localStorage,
      publish: setSession,
      readProfiles: async (uid) => {
        if (!db) throw new Error('Firebase is not configured')
        const snapshot = await getDoc(doc(db, 'users', uid))
        return snapshot.exists() ? snapshot.data().profiles : undefined
      },
      onError: (error) => console.error('Could not load account profiles:', error),
    })
    const unsubscribe = auth
      ? onAuthStateChanged(auth, (firebaseUser) => { void loader.load(firebaseUser) })
      : (() => { void loader.load(null); return () => {} })()
    return () => { loader.cancel(); unsubscribe() }
  }, [])

  useEffect(() => {
    if (loading || !user || !session.dirty || auth?.currentUser?.uid !== user.uid) return
    localStorage.setItem(profileKey(user.uid), JSON.stringify(profiles))
    localStorage.setItem(activeKey(user.uid), activeProfileId || '')
    // Never write cached profiles over an account whose cloud read failed.
    if (db && session.canSaveRemote) {
      setDoc(doc(db, 'users', user.uid), { profiles }, { merge: true })
        .catch((error) => console.error('Could not save account profiles:', error))
    }
  }, [session, loading, user, profiles, activeProfileId])

  const setProfiles = (update) => setSession((previous) => {
    if (!previous.user || previous.loading) return previous
    const next = typeof update === 'function' ? update(previous.profiles) : update
    return { ...previous, profiles: next, dirty: true }
  })
  const setActiveProfileId = (id) => setSession((previous) => {
    if (!previous.user || previous.loading || !previous.profiles.some((p) => p.id === id)) return previous
    return { ...previous, activeProfileId: id, dirty: true }
  })

  const role = useMemo(() => {
    if (!user?.email) return null
    return ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'guardian'
  }, [user])
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  )

  const signUp = async (email, password, displayName = '') => {
    if (!auth) throw new Error('Firebase is not configured')
    const response = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(response.user, { displayName })
      setSession((previous) => previous.user?.uid === response.user.uid && !previous.loading
        ? { ...previous, profiles: normalizeProfiles(response.user, previous.profiles).profiles, dirty: true }
        : previous)
    }
    await ensureUserDocument({
      uid: response.user.uid, email: response.user.email,
      displayName: displayName || email.split('@')[0],
      role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'guardian',
    })
    try { await sendEmailVerification(response.user) }
    catch (error) { console.warn('Verification email could not be sent:', error) }
    return response
  }

  const logIn = async (email, password) => {
    if (!auth) throw new Error('Firebase is not configured')
    // Firebase errors propagate to the form. No synthetic session is created.
    return signInWithEmailAndPassword(auth, email, password)
  }
  const logOut = async () => {
    localStorage.removeItem('pureplay_demo_user')
    if (auth) await signOut(auth)
  }
  const resetPassword = (email) => {
    if (!auth) throw new Error('Firebase is not configured')
    return sendPasswordResetEmail(auth, email)
  }
  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured')
    const response = await signInWithPopup(auth, googleProvider)
    await ensureUserDocument({
      uid: response.user.uid, email: response.user.email,
      displayName: response.user.displayName || response.user.email?.split('@')[0],
      role: ADMIN_EMAILS.includes((response.user.email || '').toLowerCase()) ? 'admin' : 'guardian',
    })
    return response
  }

  const updateProfilePin = (profileId, newPin) => {
    const cleanPin = String(newPin || '').replace(/\D/g, '').slice(0, 6)
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, pin: cleanPin } : p))
    )
    return { success: true }
  }

  const switchProfile = (profileId, pin = '', isGuardianOverride = false) => {
    const target = profiles.find((p) => p.id === profileId)
    if (!target) return { success: false, error: 'Profile not found' }

    const isRestrictedActive = (activeProfile?.type === 'child' || activeProfile?.type === 'teen')
    const guardianProfile = profiles.find((p) => p.type === 'guardian')
    const configuredPins = profiles.map((p) => p.pin).filter(Boolean)

    // Switching to Guardian from a child/junior profile ALWAYS requires the passcode
    if (!isGuardianOverride && isRestrictedActive && target.type === 'guardian') {
      const validPins = [guardianProfile?.pin, activeProfile?.pin, ...configuredPins].filter(Boolean)
      if (validPins.length > 0) {
        if (!pin || !validPins.includes(pin)) {
          return { success: false, error: 'Incorrect passcode. Guardian access locked.' }
        }
      } else {
        // No PIN was configured in the household. User must enter a 4-6 digit passcode to unlock Guardian.
        if (!pin || pin.length < 4) {
          return { success: false, error: 'Please enter a 4-6 digit passcode to unlock Guardian mode.' }
        }
        if (guardianProfile) {
          setProfiles((prev) =>
            prev.map((p) => (p.id === guardianProfile.id ? { ...p, pin } : p))
          )
        }
      }
    }

    // If leaving a locked child or junior profile to any profile
    if (!isGuardianOverride && isRestrictedActive && activeProfile?.pin) {
      if (activeProfile.pin !== pin && guardianProfile?.pin !== pin) {
        return { success: false, error: 'Incorrect security PIN' }
      }
    }

    // If target profile has a PIN
    if (!isGuardianOverride && target.pin && target.pin !== pin) {
      return { success: false, error: target.type === 'guardian' ? 'Incorrect guardian passcode' : 'Incorrect PIN' }
    }

    setActiveProfileId(profileId)
    return { success: true }
  }

  const createProfile = ({ name, type, pin, policy }) => {
    if (!user || loading) throw new Error('Sign in before creating a profile')
    const newProfile = {
      id: crypto.randomUUID(),
      name,
      type,
      pin: pin || '',
      policy: policy ?? defaultPolicy,
      createdAt: new Date().toISOString(),
    }
    setProfiles((prev) => [...prev, newProfile])
    if (!activeProfileId || profiles.length === 0) setActiveProfileId(newProfile.id)
    return newProfile
  }

  const deleteProfile = (profileId) => {
    if (profiles.find((p) => p.id === profileId)?.isPrimary) return
    setProfiles((prev) => prev.filter((p) => p.id !== profileId))
    if (activeProfileId === profileId) {
      const remaining = profiles.filter((p) => p.id !== profileId)
      setActiveProfileId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const value = {
    user,
    role,
    isFirebaseConfigured,
    loading,
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    switchProfile,
    updateProfilePin,
    signUp,
    logIn,
    logOut,
    resetPassword,
    signInWithGoogle,
    createProfile,
    deleteProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The provider and its consumer hook intentionally share the same context.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
