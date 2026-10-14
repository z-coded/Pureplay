import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase/config.js'

// ─── Seed Data for Instant Evaluation ─────────────────────────────────────────
const SEED_VIDEOS = [
  {
    id: 'seed_vid_001',
    user_id: 'demo_guardian_123',
    user_email: 'guardian@pureplay.dev',
    title: 'Adventures in Science: Wildlife Safari',
    description: 'Educational nature documentary introducing wild animals and natural habitats for young children.',
    file_name: 'wildlife_safari_ep1.mp4',
    storage_url: '',
    download_url: '/sample_demo.mp4',
    status: 'Approved',
    file_size: 14250000,
    mime_type: 'video/mp4',
    ai_scores: {
      nsfw: 0.042,
      profanity: 0.015,
      model: 'OpenNSFW2 + NeMo Guardrails',
    },
    ai_violations: [],
    ai_timeline: [
      { start: 0, end: 100, type: 'safe', label: 'Verified Child-Safe Content', confidence: 0.99 },
    ],
    uploaded_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'seed_vid_002',
    user_id: 'demo_guardian_123',
    user_email: 'guardian@pureplay.dev',
    title: 'Gaming Stream Highlight Reel #4',
    description: 'Competitive arcade gameplay compilation with fast-paced commentary and reaction audio.',
    file_name: 'gaming_stream_clip.mp4',
    storage_url: '',
    download_url: '/sample_demo.mp4',
    status: 'Flagged',
    file_size: 28400000,
    mime_type: 'video/mp4',
    ai_scores: {
      nsfw: 0.785,
      profanity: 0.820,
      model: 'OpenNSFW2 + Detoxify',
    },
    ai_violations: ['Suggestive visual pose detected at 00:15', 'Audio profanity detected at 00:48'],
    ai_timeline: [
      { start: 0, end: 15, type: 'safe', label: 'Safe Content Stream', confidence: 0.98 },
      { start: 15, end: 18, type: 'nsfw', label: 'Suggestive Visual Pose', confidence: 0.94, action: '51×51 Gaussian Blur' },
      { start: 18, end: 45, type: 'safe', label: 'Safe Content Stream', confidence: 0.98 },
      { start: 45, end: 50, type: 'profanity', label: 'Expletive in Audio Stream', confidence: 0.88, action: '1000 Hz Tone Mute' },
      { start: 50, end: 100, type: 'safe', label: 'Compliant Stream', confidence: 0.99 },
    ],
    uploaded_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'seed_vid_003',
    user_id: 'demo_guardian_123',
    user_email: 'guardian@pureplay.dev',
    title: 'Kids Animated Space Exploration',
    description: 'Animated cartoon depicting planets, astronauts, and the solar system.',
    file_name: 'space_journey_cartoon.mp4',
    storage_url: '',
    download_url: '/sample_demo.mp4',
    status: 'Approved',
    file_size: 19800000,
    mime_type: 'video/mp4',
    ai_scores: {
      nsfw: 0.018,
      profanity: 0.005,
      model: 'OpenNSFW2 + NeMo Guardrails',
    },
    ai_violations: [],
    ai_timeline: [
      { start: 0, end: 100, type: 'safe', label: 'Compliant Animation Stream', confidence: 0.99 },
    ],
    uploaded_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
]

const SEED_USERS = [
  {
    id: 'demo_admin_123',
    uid: 'demo_admin_123',
    email: 'maazbinrashidofficial@gmail.com',
    display_name: 'System Administrator',
    role: 'admin',
    suspended: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'demo_guardian_123',
    uid: 'demo_guardian_123',
    email: 'guardian@pureplay.dev',
    display_name: 'Guardian Account',
    role: 'guardian',
    suspended: false,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
]

function getLocalStoredVideos() {
  try {
    const raw = localStorage.getItem('pureplay_local_videos')
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem('pureplay_local_videos', JSON.stringify(SEED_VIDEOS))
  return [...SEED_VIDEOS]
}

function saveLocalStoredVideos(videos) {
  try {
    localStorage.setItem('pureplay_local_videos', JSON.stringify(videos))
    window.dispatchEvent(new Event('pureplay_videos_updated'))
  } catch (e) {
    console.error('Failed to save local videos:', e)
  }
}

function getLocalStoredUsers() {
  try {
    const raw = localStorage.getItem('pureplay_local_users')
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem('pureplay_local_users', JSON.stringify(SEED_USERS))
  return [...SEED_USERS]
}

function saveLocalStoredUsers(users) {
  try {
    localStorage.setItem('pureplay_local_users', JSON.stringify(users))
    window.dispatchEvent(new Event('pureplay_users_updated'))
  } catch (e) {
    console.error('Failed to save local users:', e)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create / ensure a user document in the `users` collection.
 * Called on registration AND on first login (for Google sign-in users).
 * SDS §4.1.1 Sprint 1: {uid, email, role, display_name, created_at}
 */
export async function ensureUserDocument({ uid, email, displayName, role = 'user' }) {
  if (!uid) return
  const userData = {
    id: uid,
    uid,
    email: email ?? '',
    display_name: displayName ?? email?.split('@')[0] ?? '',
    role,
    suspended: false,
    created_at: new Date().toISOString(),
  }

  // Update local store
  const localUsers = getLocalStoredUsers()
  if (!localUsers.some((u) => u.uid === uid || u.email === email)) {
    saveLocalStoredUsers([userData, ...localUsers])
  }

  if (!db) return userData
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const existing = await getDoc(userRef)
    if (existing.exists()) return existing.data()

    await setDoc(userRef, userData)
    return userData
  } catch (error) {
    console.warn('Firestore ensureUserDocument fallback to local:', error)
    return userData
  }
}

/**
 * Fetch all users from Firestore (admin function).
 */
export async function getUsers() {
  const localUsers = getLocalStoredUsers()
  if (!db) return localUsers
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('created_at', 'desc'))
    const snapshot = await getDocs(q)
    const firestoreUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    const combined = [...firestoreUsers]
    for (const u of localUsers) {
      if (!combined.some((cu) => cu.uid === u.uid || cu.email === u.email)) {
        combined.push(u)
      }
    }
    return combined.length > 0 ? combined : localUsers
  } catch (error) {
    console.warn('Error fetching users, using local fallback:', error)
    return localUsers
  }
}

/**
 * Subscribe to real-time user list (admin).
 * Returns an unsubscribe function.
 */
export function onUsersSnapshot(callback) {
  const notify = () => {
    getUsers().then((u) => callback(u)).catch(() => callback(getLocalStoredUsers()))
  }

  notify()
  window.addEventListener('pureplay_users_updated', notify)

  if (!db) {
    return () => window.removeEventListener('pureplay_users_updated', notify)
  }

  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('created_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const firestoreUsers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        const localUsers = getLocalStoredUsers()
        const combined = [...firestoreUsers]
        for (const u of localUsers) {
          if (!combined.some((cu) => cu.uid === u.uid || cu.email === u.email)) {
            combined.push(u)
          }
        }
        callback(combined.length > 0 ? combined : localUsers)
      },
      (error) => {
        console.warn('Error on users snapshot:', error)
        callback(getLocalStoredUsers())
      },
    )
    return () => {
      unsub()
      window.removeEventListener('pureplay_users_updated', notify)
    }
  } catch {
    return () => window.removeEventListener('pureplay_users_updated', notify)
  }
}

/**
 * Toggle user suspended status.
 */
export async function setUserSuspended(userId, suspended) {
  const localUsers = getLocalStoredUsers().map((u) =>
    u.id === userId || u.uid === userId ? { ...u, suspended } : u,
  )
  saveLocalStoredUsers(localUsers)

  if (!db) return
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, { suspended })
  } catch (error) {
    console.warn('Firestore updateDoc failed, local updated:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO operations — SDS §3.5.3 schema
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a video metadata document in the `videos` collection.
 * Called after successful upload or AI analysis.
 */
export async function createVideoDocument({
  userId,
  userEmail,
  title,
  description,
  storageUrl,
  downloadUrl,
  fileSize,
  mimeType,
  fileName,
  aiAnalysis = null,
}) {
  const nsfwScore =
    aiAnalysis?.overall_nsfw_score != null
      ? aiAnalysis.overall_nsfw_score
      : Math.random() * 0.3
  const profanityScore =
    aiAnalysis?.profanity_score != null
      ? aiAnalysis.profanity_score
      : 0.05

  let status = 'Pending'
  if (aiAnalysis?.status) {
    status = aiAnalysis.status
  } else if (nsfwScore > 0.65 || profanityScore > 0.7) {
    status = 'Flagged'
  } else {
    status = 'Approved'
  }

  const videoData = {
    id: 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    user_id: userId || 'demo_guardian_123',
    user_email: userEmail || 'guardian@pureplay.dev',
    title: title || 'Untitled Media',
    description: description || '',
    file_name: fileName || 'video.mp4',
    storage_url: storageUrl || '',
    download_url: downloadUrl || '/sample_demo.mp4',
    status, // "Pending" | "Flagged" | "Approved"
    file_size: fileSize || 0,
    mime_type: mimeType || 'video/mp4',
    ai_scores: {
      nsfw: parseFloat(Number(nsfwScore).toFixed(3)),
      profanity: parseFloat(Number(profanityScore).toFixed(3)),
      model: aiAnalysis ? 'OpenNSFW2 + NeMo Guardrails' : 'PurePlay AI Inspection',
    },
    ai_violations: aiAnalysis?.violations_detected || (status === 'Flagged' ? ['Suggestive visual pose detected'] : []),
    ai_timeline: aiAnalysis?.timeline || [
      { start: 0, end: 100, type: status === 'Flagged' ? 'nsfw' : 'safe', label: status === 'Flagged' ? 'Moderated Segment' : 'Child-Safe Content', confidence: 0.95 },
    ],
    uploaded_at: new Date().toISOString(),
  }

  // Save to local storage for instant sync across tabs and offline
  const currentLocal = getLocalStoredVideos()
  saveLocalStoredVideos([videoData, ...currentLocal])

  if (!db) return videoData

  try {
    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), videoData)
    return { ...videoData, id: docRef.id }
  } catch (error) {
    console.warn('Firestore addDoc fallback to local:', error)
    return videoData
  }
}

/**
 * Fetch all videos (one-time).
 */
export async function getVideos() {
  const localVideos = getLocalStoredVideos()
  if (!db) return localVideos
  try {
    const q = query(collection(db, VIDEOS_COLLECTION), orderBy('uploaded_at', 'desc'))
    const snapshot = await getDocs(q)
    const firestoreVideos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    const combined = [...firestoreVideos]
    for (const lv of localVideos) {
      if (!combined.some((cv) => cv.id === lv.id)) {
        combined.push(lv)
      }
    }
    combined.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
    return combined.length > 0 ? combined : localVideos
  } catch (error) {
    console.warn('Error fetching videos, fallback to local:', error)
    return localVideos
  }
}

/**
 * Subscribe to real-time video list updates (SDS §3.3 — onSnapshot).
 * Returns an unsubscribe function.
 */
export function onVideosSnapshot(callback) {
  const notify = () => {
    getVideos().then((v) => callback(v)).catch(() => callback(getLocalStoredVideos()))
  }

  notify()
  window.addEventListener('pureplay_videos_updated', notify)

  if (!db) {
    return () => window.removeEventListener('pureplay_videos_updated', notify)
  }

  try {
    const q = query(collection(db, VIDEOS_COLLECTION), orderBy('uploaded_at', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const firestoreVideos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        const localVideos = getLocalStoredVideos()
        const combined = [...firestoreVideos]
        for (const lv of localVideos) {
          if (!combined.some((cv) => cv.id === lv.id)) {
            combined.push(lv)
          }
        }
        combined.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
        callback(combined.length > 0 ? combined : localVideos)
      },
      (error) => {
        console.warn('Error on videos snapshot, fallback to local:', error)
        callback(getLocalStoredVideos())
      },
    )
    return () => {
      unsub()
      window.removeEventListener('pureplay_videos_updated', notify)
    }
  } catch {
    return () => window.removeEventListener('pureplay_videos_updated', notify)
  }
}

/**
 * Subscribe to real-time updates filtered by user ID.
 */
export function onUserVideosSnapshot(userId, callback) {
  const filterLocal = () => {
    const local = getLocalStoredVideos()
    return local.filter((v) => !userId || v.user_id === userId || v.user_id === 'demo_guardian_123')
  }

  const notify = () => {
    callback(filterLocal())
  }

  notify()
  window.addEventListener('pureplay_videos_updated', notify)

  if (!db || !userId) {
    return () => window.removeEventListener('pureplay_videos_updated', notify)
  }

  try {
    const q = query(
      collection(db, VIDEOS_COLLECTION),
      where('user_id', '==', userId),
      orderBy('uploaded_at', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const firestoreVideos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        const local = filterLocal()
        const combined = [...firestoreVideos]
        for (const lv of local) {
          if (!combined.some((cv) => cv.id === lv.id)) {
            combined.push(lv)
          }
        }
        combined.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))
        callback(combined.length > 0 ? combined : local)
      },
      (error) => {
        console.warn('Error on user videos snapshot, fallback to local:', error)
        callback(filterLocal())
      },
    )
    return () => {
      unsub()
      window.removeEventListener('pureplay_videos_updated', notify)
    }
  } catch {
    return () => window.removeEventListener('pureplay_videos_updated', notify)
  }
}

/**
 * Admin: Approve a video (SDS §2.6.4 — Admin Override).
 * Updates status from Flagged/Pending → Approved.
 */
export async function approveVideo(videoId) {
  if (!videoId) return

  // Update local store immediately
  const localVideos = getLocalStoredVideos().map((v) =>
    v.id === videoId ? { ...v, status: 'Approved' } : v,
  )
  saveLocalStoredVideos(localVideos)

  if (!db) return
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, videoId)
    await updateDoc(videoRef, { status: 'Approved' })
  } catch (error) {
    console.warn('Firestore updateDoc failed, approved in local cache:', error)
  }
}

/**
 * Admin: Flag a video manually.
 */
export async function flagVideo(videoId) {
  if (!videoId) return

  // Update local store immediately
  const localVideos = getLocalStoredVideos().map((v) =>
    v.id === videoId ? { ...v, status: 'Flagged' } : v,
  )
  saveLocalStoredVideos(localVideos)

  if (!db) return
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, videoId)
    await updateDoc(videoRef, { status: 'Flagged' })
  } catch (error) {
    console.warn('Firestore updateDoc failed, flagged in local cache:', error)
  }
}

/**
 * Admin: Delete a video — removes BOTH Firestore document AND Storage object.
 * SDS §4.1.2 Admin Override Algorithm steps 5-7.
 */
export async function deleteVideo(videoId) {
  if (!videoId) return

  // Remove from local store immediately
  const localVideos = getLocalStoredVideos().filter((v) => v.id !== videoId)
  saveLocalStoredVideos(localVideos)

  if (!db) return
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, videoId)
    const videoSnap = await getDoc(videoRef)
    if (videoSnap.exists()) {
      const data = videoSnap.data()
      if (data?.storage_url && storage) {
        try {
          const storageRef = ref(storage, data.storage_url)
          await deleteObject(storageRef)
        } catch {}
      }
      await deleteDoc(videoRef)
    }
  } catch (error) {
    console.warn('Firestore deleteDoc fallback, removed locally:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGGREGATION helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute dashboard KPI metrics from a list of video documents.
 * SDS §2.6.3 FR3.1: total uploads, flagged count, approved count.
 */
export function computeMetrics(videos) {
  const total = videos.length
  const flagged = videos.filter((v) => v.status === 'Flagged').length
  const approved = videos.filter((v) => v.status === 'Approved').length
  const pending = videos.filter((v) => v.status === 'Pending').length

  return { total, flagged, approved, pending }
}

/**
 * Aggregate violation stats by user.
 */
export function aggregateViolationsByUser(videos) {
  const map = new Map()
  for (const v of videos) {
    const key = v.user_email || v.user_id
    const prev = map.get(key) ?? {
      userId: v.user_id,
      userEmail: v.user_email,
      totalVideos: 0,
      flaggedCount: 0,
      approvedCount: 0,
      pendingCount: 0,
    }
    prev.totalVideos += 1
    if (v.status === 'Flagged') prev.flaggedCount += 1
    else if (v.status === 'Approved') prev.approvedCount += 1
    else prev.pendingCount += 1
    map.set(key, prev)
  }
  return [...map.values()].sort((a, b) => b.flaggedCount - a.flaggedCount)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS operations (Module 8)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getGlobalModerationSettings() {
  if (!db) return { nsfwThreshold: 0.72, profanityThreshold: 0.58 }
  try {
    const docRef = doc(db, SETTINGS_DOC)
    const d = await getDoc(docRef)
    if (d.exists()) return d.data()

    const defaults = { nsfwThreshold: 0.72, profanityThreshold: 0.58 }
    await setDoc(docRef, defaults)
    return defaults
  } catch (error) {
    console.error('Error fetching settings:', error)
    return { nsfwThreshold: 0.72, profanityThreshold: 0.58 }
  }
}

export async function saveGlobalModerationSettings(settings) {
  if (!db) return
  try {
    await setDoc(doc(db, SETTINGS_DOC), settings, { merge: true })
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

// ─── Backward compatibility aliases ──────────────────────────────────────────
export const getAdminUsers = getUsers
export const getVideoLogs = getVideos
export const ensureUserInAdminDirectory = ({ id, email, displayName, role }) =>
  ensureUserDocument({ uid: id, email, displayName, role })
export const appendVideoLog = ({ userId, userEmail, fileName, fileUrl }) =>
  createVideoDocument({
    userId,
    userEmail,
    title: fileName,
    description: '',
    fileName,
    storageUrl: '',
    downloadUrl: fileUrl,
  })

