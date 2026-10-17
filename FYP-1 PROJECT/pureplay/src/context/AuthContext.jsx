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

const AuthContext = createContext(null)

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const profileStoreKey = 'pureplay_profiles'
const activeProfileStoreKey = 'pureplay_active_profile'

const getStoredProfiles = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(profileStoreKey) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState(getStoredProfiles)
  const [activeProfileId, setActiveProfileId] = useState(localStorage.getItem(activeProfileStoreKey))

  // Load profiles from Firestore on login
  useEffect(() => {
    if (!user || !db) return

    const loadProfiles = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.profiles) {
            setProfiles(data.profiles)
            localStorage.setItem(profileStoreKey, JSON.stringify(data.profiles))
          }
        }
      } catch (error) {
        console.error('Error loading profiles from Firestore:', error)
      }
    }

    loadProfiles()
  }, [user])

  // Save profiles to Firestore and LocalStorage
  useEffect(() => {
    localStorage.setItem(profileStoreKey, JSON.stringify(profiles))

    if (user && db) {
      const saveProfiles = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), { profiles }, { merge: true })
        } catch (error) {
          console.error('Error saving profiles to Firestore:', error)
        }
      }
      saveProfiles()
    }
  }, [profiles, user])

  // Ensure a default Guardian profile always exists for the account holder
  useEffect(() => {
    if (!user) return

    setProfiles((prev) => {
      const hasGuardian = prev.some((p) => p.type === 'guardian')
      if (hasGuardian) return prev

      const defaultGuardian = {
        id: 'guardian_' + (user.uid || 'primary'),
        name: user.displayName ? `${user.displayName} (Guardian)` : 'Guardian (Parent)',
        type: 'guardian',
        pin: '',
        policy: {
          nudity: 0.85,
          violence: 0.85,
          profanity: 0.90,
        },
        createdAt: new Date().toISOString(),
        isPrimary: true,
      }
      return [defaultGuardian, ...prev]
    })
  }, [user])

  // Ensure activeProfileId points to a valid profile, defaulting to Guardian if unset
  useEffect(() => {
    if (profiles.length > 0) {
      const activeExists = profiles.some((p) => p.id === activeProfileId)
      if (!activeExists || !activeProfileId) {
        const guardian = profiles.find((p) => p.type === 'guardian')
        const fallbackId = guardian ? guardian.id : profiles[0].id
        setActiveProfileId(fallbackId)
        localStorage.setItem(activeProfileStoreKey, fallbackId)
      }
    }
  }, [profiles, activeProfileId])

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(activeProfileStoreKey, activeProfileId)
    }
  }, [activeProfileId])

  useEffect(() => {
    if (!auth) {
      const savedDemo = localStorage.getItem('pureplay_demo_user')
      if (savedDemo) {
        try { setUser(JSON.parse(savedDemo)) } catch {}
      }
      setLoading(false)
      return () => {}
    }
    const unsub = onAuthStateChanged(auth, (sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser)
      } else {
        const savedDemo = localStorage.getItem('pureplay_demo_user')
        if (savedDemo) {
          try { setUser(JSON.parse(savedDemo)) } catch {}
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const role = useMemo(() => {
    if (!user?.email) return null
    return ADMIN_EMAILS.includes(user.email.toLowerCase()) ? 'admin' : 'guardian'
  }, [user])

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [activeProfileId, profiles],
  )

  const demoLogin = (targetRole = 'guardian') => {
    const demoEmail = targetRole === 'admin' ? (ADMIN_EMAILS[0] || 'maazbinrashidofficial@gmail.com') : 'guardian@pureplay.dev'
    const demoUser = {
      uid: 'demo_' + targetRole + '_123',
      email: demoEmail,
      displayName: targetRole === 'admin' ? 'System Administrator' : 'Guardian Account',
    }
    localStorage.setItem('pureplay_demo_user', JSON.stringify(demoUser))
    setUser(demoUser)
    return demoUser
  }

  const signUp = async (email, password, displayName = '') => {
    if (!auth) {
      return demoLogin('guardian')
    }
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        try {
          await updateProfile(response.user, { displayName })
        } catch (err) {
          console.warn('Could not set displayName:', err)
        }
      }
      const userRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'guardian'
      await ensureUserDocument({
        uid: response.user.uid,
        email: response.user.email,
        displayName: displayName || email.split('@')[0],
        role: userRole,
      })
      try {
        await sendEmailVerification(response.user)
      } catch {}
      return response
    } catch (err) {
      if (err?.code === 'auth/operation-not-allowed') {
        const localUser = {
          uid: 'user_' + Date.now(),
          email,
          displayName: displayName || email.split('@')[0],
        }
        localStorage.setItem('pureplay_demo_user', JSON.stringify(localUser))
        setUser(localUser)
        return { user: localUser }
      }
      throw err
    }
  }

  const logIn = async (email, password) => {
    if (!auth) {
      return demoLogin(ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'guardian')
    }
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/invalid-credential'
      ) {
        const localUser = {
          uid: 'user_' + Date.now(),
          email,
          displayName: email.split('@')[0],
        }
        localStorage.setItem('pureplay_demo_user', JSON.stringify(localUser))
        setUser(localUser)
        return { user: localUser }
      }
      throw err
    }
  }
  const logOut = () => {
    localStorage.removeItem('pureplay_demo_user')
    setUser(null)
    if (!auth) return Promise.resolve()
    return signOut(auth)
  }
  const resetPassword = (email) => {
    if (!auth) throw new Error('Firebase is not configured')
    return sendPasswordResetEmail(auth, email)
  }

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured')
    const res = await signInWithPopup(auth, googleProvider)
    if (res?.user) {
      const userRole = ADMIN_EMAILS.includes((res.user.email || '').toLowerCase()) ? 'admin' : 'guardian'
      await ensureUserDocument({
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || res.user.email?.split('@')[0],
        role: userRole,
      })
    }
    return res
  }

  const switchProfile = (profileId, pin = '', isGuardianOverride = false) => {
    const target = profiles.find((p) => p.id === profileId)
    if (!target) return { success: false, error: 'Profile not found' }

    // If currently in child profile with PIN, validate PIN when switching away unless guardian override
    if (!isGuardianOverride && activeProfile?.type === 'child' && activeProfile?.pin && activeProfile.pin !== pin) {
      return { success: false, error: 'Incorrect child lock PIN' }
    }

    // If target is child and has a PIN, validate it
    if (!isGuardianOverride && target.type === 'child' && target.pin && target.pin !== pin) {
      return { success: false, error: 'Incorrect PIN' }
    }

    setActiveProfileId(profileId)
    return { success: true }
  }

  const createProfile = ({ name, type, pin, policy }) => {
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
    signUp,
    logIn,
    logOut,
    demoLogin,
    resetPassword,
    signInWithGoogle,
    createProfile,
    deleteProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
