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

// ─── Collection names (aligned with SDS §3.5) ───────────────────────────────
const USERS_COLLECTION = 'users'
const VIDEOS_COLLECTION = 'videos'
const SETTINGS_DOC = 'settings/global_moderation'

// ═══════════════════════════════════════════════════════════════════════════════
// USER operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create / ensure a user document in the `users` collection.
 * Called on registration AND on first login (for Google sign-in users).
 * SDS §4.1.1 Sprint 1: {uid, email, role, display_name, created_at}
 */
export async function ensureUserDocument({ uid, email, displayName, role = 'user' }) {
  if (!db || !uid) return
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const existing = await getDoc(userRef)
    if (existing.exists()) return existing.data()

    const userData = {
      uid,
      email: email ?? '',
      display_name: displayName ?? email?.split('@')[0] ?? '',
      role,
      suspended: false,
      created_at: new Date().toISOString(),
    }
    await setDoc(userRef, userData)
    return userData
  } catch (error) {
    console.error('Error ensuring user document:', error)
  }
}

/**
 * Fetch all users from Firestore (admin function).
 */
export async function getUsers() {
  if (!db) return []
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('created_at', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

/**
 * Subscribe to real-time user list (admin).
 * Returns an unsubscribe function.
 */
export function onUsersSnapshot(callback) {
  if (!db) {
    callback([])
    return () => {}
  }
  const q = query(collection(db, USERS_COLLECTION), orderBy('created_at', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(users)
  }, (error) => {
    console.error('Error on users snapshot:', error)
    callback([])
  })
}

/**
 * Toggle user suspended status.
 */
export async function setUserSuspended(userId, suspended) {
  if (!db) return
  try {
    const userRef = doc(db, USERS_COLLECTION, userId)
    await updateDoc(userRef, { suspended })
  } catch (error) {
    console.error('Error suspending user:', error)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO operations — SDS §3.5.3 schema
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a video metadata document in the `videos` collection.
 * Called after successful upload to Firebase Storage.
 *
 * SDS fields: video_id, user_id, title, description, storage_url,
 *             download_url, status, file_size, mime_type, uploaded_at
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
  if (!db) return null
  try {
    const nsfwScore = aiAnalysis?.overall_nsfw_score != null
      ? aiAnalysis.overall_nsfw_score
      : Math.random()
    const profanityScore = Math.random()

    let status = 'Pending'
    if (aiAnalysis?.status) {
      status = aiAnalysis.status
    } else if (nsfwScore > 0.65 || profanityScore > 0.7) {
      status = 'Flagged'
    }

    const videoData = {
      user_id: userId,
      user_email: userEmail ?? '',
      title: title ?? '',
      description: description ?? '',
      file_name: fileName ?? '',
      storage_url: storageUrl,
      download_url: downloadUrl,
      status, // "Pending" | "Flagged" | "Approved"
      file_size: fileSize ?? 0,
      mime_type: mimeType ?? '',
      ai_scores: {
        nsfw: parseFloat(nsfwScore.toFixed(3)),
        profanity: parseFloat(profanityScore.toFixed(3)),
        model: aiAnalysis ? 'NudeNet ONNX (Real)' : 'Simulated Heuristics',
      },
      ai_violations: aiAnalysis?.violations_detected ?? [],
      ai_timeline: aiAnalysis?.timeline ?? [],
      uploaded_at: new Date().toISOString(),
    }

    const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), videoData)
    return { id: docRef.id, ...videoData }
  } catch (error) {
    console.error('Error creating video document:', error)
    return null
  }
}

/**
 * Fetch all videos (one-time).
 */
export async function getVideos() {
  if (!db) return []
  try {
    const q = query(collection(db, VIDEOS_COLLECTION), orderBy('uploaded_at', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

/**
 * Subscribe to real-time video list updates (SDS §3.3 — onSnapshot).
 * Returns an unsubscribe function.
 */
export function onVideosSnapshot(callback) {
  if (!db) {
    callback([])
    return () => {}
  }
  const q = query(collection(db, VIDEOS_COLLECTION), orderBy('uploaded_at', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const videos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(videos)
  }, (error) => {
    console.error('Error on videos snapshot:', error)
    callback([])
  })
}

/**
 * Subscribe to real-time updates filtered by user ID.
 */
export function onUserVideosSnapshot(userId, callback) {
  if (!db || !userId) {
    callback([])
    return () => {}
  }
  const q = query(
    collection(db, VIDEOS_COLLECTION),
    where('user_id', '==', userId),
    orderBy('uploaded_at', 'desc'),
  )
  return onSnapshot(q, (snapshot) => {
    const videos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(videos)
  }, (error) => {
    console.error('Error on user videos snapshot:', error)
    callback([])
  })
}

/**
 * Admin: Approve a video (SDS §2.6.4 — Admin Override).
 * Updates status from Flagged/Pending → Approved.
 */
export async function approveVideo(videoId) {
  if (!db || !videoId) return
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, videoId)
    await updateDoc(videoRef, { status: 'Approved' })
  } catch (error) {
    console.error('Error approving video:', error)
    throw error
  }
}

/**
 * Admin: Flag a video manually.
 */
export async function flagVideo(videoId) {
  if (!db || !videoId) return
  try {
    const videoRef = doc(db, VIDEOS_COLLECTION, videoId)
    await updateDoc(videoRef, { status: 'Flagged' })
  } catch (error) {
    console.error('Error flagging video:', error)
    throw error
  }
}

/**
 * Admin: Delete a video — removes BOTH Firestore document AND Storage object.
 * SDS §4.1.2 Admin Override Algorithm steps 5-7.
 */
export async function deleteVideo(videoId) {
  if (!db || !videoId) return
  try {
    // 1. Get the video document to find its storage path
    const videoRef = doc(db, VIDEOS_COLLECTION, videoId)
    const videoSnap = await getDoc(videoRef)

    if (!videoSnap.exists()) {
      console.warn('Video document does not exist:', videoId)
      return
    }

    const videoData = videoSnap.data()

    // 2. Delete from Firebase Storage if storage_url exists
    if (videoData.storage_url && storage) {
      try {
        const storageRef = ref(storage, videoData.storage_url)
        await deleteObject(storageRef)
      } catch (storageError) {
        // Storage object may already be deleted — don't block Firestore cleanup
        console.warn('Storage delete failed (may already be removed):', storageError)
      }
    }

    // 3. Delete from Firestore
    await deleteDoc(videoRef)
  } catch (error) {
    console.error('Error deleting video:', error)
    throw error
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

