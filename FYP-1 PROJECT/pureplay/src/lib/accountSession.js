export const emptySession = () => ({
  user: null, profiles: [], activeProfileId: null, loading: false,
  canSaveRemote: false, dirty: false,
})

export const profileKey = (uid) => `pureplay_profiles:${uid}`
export const activeKey = (uid) => `pureplay_active_profile:${uid}`

export function normalizeProfiles(user, stored) {
  const primaryId = `guardian_${user.uid}`
  const valid = Array.isArray(stored)
    ? stored.filter((p) => p && typeof p.id === 'string' && ['guardian', 'teen', 'child'].includes(p.type))
    : []
  // Earlier versions could save account A's entire household into account B.
  const contaminated = valid.some((p) =>
    (p.isPrimary || p.id.startsWith('guardian_')) && p.id !== primaryId)
  const owned = contaminated ? [] : valid
  const existing = owned.find((p) => p.id === primaryId)
  const primary = {
    ...existing,
    id: primaryId,
    name: `${user.displayName || user.email?.split('@')[0] || 'Account holder'} (Guardian)`,
    type: 'guardian',
    pin: existing?.pin || '',
    policy: existing?.policy || { nudity: 0.85, violence: 0.85, profanity: 0.90 },
    createdAt: existing?.createdAt || new Date().toISOString(),
    isPrimary: true,
  }
  return { profiles: [primary, ...owned.filter((p) => p.id !== primaryId)], contaminated }
}

function readCache(storage, uid) {
  try { return JSON.parse(storage.getItem(profileKey(uid)) || '[]') }
  catch { return [] }
}

export function createSessionLoader({ storage, readProfiles, publish, onError = () => {} }) {
  let generation = 0
  // Unscoped legacy data has no trustworthy owner; never restore it as a login.
  for (const key of ['pureplay_demo_user', 'pureplay_profiles', 'pureplay_active_profile']) {
    storage.removeItem(key)
  }
  return {
    async load(user) {
      const request = ++generation
      publish({ ...emptySession(), user, loading: Boolean(user) })
      if (!user) return
      let stored = readCache(storage, user.uid)
      let canSaveRemote = false
      try {
        const remote = await readProfiles(user.uid)
        if (remote !== undefined) stored = remote
        canSaveRemote = true
      } catch (error) {
        onError(error)
      }
      // A late read from an old account must not replace a newer session.
      if (request !== generation) return
      const { profiles, contaminated } = normalizeProfiles(user, stored)
      if (contaminated) {
        storage.setItem(`pureplay_profiles_recovery:${user.uid}`, JSON.stringify(stored))
      }
      const savedActive = storage.getItem(activeKey(user.uid))
      const activeProfileId = profiles.some((p) => p.id === savedActive) ? savedActive : profiles[0].id
      storage.setItem(profileKey(user.uid), JSON.stringify(profiles))
      storage.setItem(activeKey(user.uid), activeProfileId)
      publish({ user, profiles, activeProfileId, loading: false, canSaveRemote, dirty: false })
    },
    cancel() { generation += 1 },
  }
}
