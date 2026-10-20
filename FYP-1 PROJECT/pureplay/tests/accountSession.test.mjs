import test from 'node:test'
import assert from 'node:assert/strict'
import { activeKey, createSessionLoader, normalizeProfiles, profileKey } from '../src/lib/accountSession.js'

const alice = { uid: 'alice', email: 'alice@example.test', displayName: 'Alice' }
const bob = { uid: 'bob', email: 'bob@example.test', displayName: 'Bob' }
function setup(readProfiles = async () => undefined) {
  const entries = new Map()
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  }
  const states = []
  return { entries, storage, states, loader: createSessionLoader({ storage, readProfiles, publish: (s) => states.push(s) }) }
}

test('switching accounts creates an owned guardian, without copying another household', async () => {
  const { loader, storage, states } = setup()
  await loader.load(alice)
  storage.setItem(profileKey('alice'), JSON.stringify([
    ...states.at(-1).profiles, { id: 'alice-child', name: 'Alice child', type: 'child' },
  ]))
  await loader.load(bob)
  assert.deepEqual(states.at(-1).profiles.map((p) => p.id), ['guardian_bob'])
  assert.equal(states.at(-1).profiles[0].name, 'Bob (Guardian)')
  assert.equal(states.at(-1).dirty, false)
  await loader.load(alice)
  assert.equal(states.at(-1).profiles.length, 2)
})

test('logout immediately clears identity and household', async () => {
  const { loader, states } = setup()
  await loader.load(alice)
  await loader.load(null)
  assert.equal(states.at(-1).user, null)
  assert.deepEqual(states.at(-1).profiles, [])
  assert.equal(states.at(-1).activeProfileId, null)
})

test('late response from previous account cannot replace the active user', async () => {
  let finishAlice
  const pending = new Promise((resolve) => { finishAlice = resolve })
  const { loader, states } = setup((uid) => uid === 'alice' ? pending : Promise.resolve([]))
  const loadingAlice = loader.load(alice)
  await loader.load(bob)
  finishAlice([{ id: 'alice-child', type: 'child' }])
  await loadingAlice
  assert.equal(states.at(-1).user.uid, 'bob')
  assert.equal(states.at(-1).profiles[0].id, 'guardian_bob')
})

test('logout while cloud data loads cannot revive the old session', async () => {
  let resolve
  const { loader, states } = setup(() => new Promise((done) => { resolve = done }))
  const pending = loader.load(alice)
  await loader.load(null)
  resolve([])
  await pending
  assert.equal(states.at(-1).user, null)
})

test('old demo login and globally shared profiles are removed, not migrated', async () => {
  const { storage, entries } = setup()
  storage.setItem('pureplay_demo_user', JSON.stringify(alice))
  storage.setItem('pureplay_profiles', JSON.stringify([{ id: 'guardian_alice', type: 'guardian' }]))
  storage.setItem('pureplay_active_profile', 'guardian_alice')
  const states = []
  const loader = createSessionLoader({ storage, readProfiles: async () => undefined, publish: (s) => states.push(s) })
  await loader.load(null)
  assert.equal(entries.has('pureplay_demo_user'), false)
  assert.equal(entries.has('pureplay_profiles'), false)
  assert.equal(entries.has('pureplay_active_profile'), false)
  assert.equal(states.at(-1).user, null)
})

test('cloud profiles contaminated by an old account are quarantined', async () => {
  const foreign = [{ id: 'guardian_alice', type: 'guardian', name: 'Alice', isPrimary: true },
    { id: 'child-of-alice', type: 'child' }]
  const { loader, storage, states } = setup(async () => foreign)
  await loader.load(bob)
  assert.deepEqual(states.at(-1).profiles.map((p) => p.id), ['guardian_bob'])
  assert.deepEqual(JSON.parse(storage.getItem('pureplay_profiles_recovery:bob')), foreign)
  assert.equal(states.at(-1).dirty, false)
})

test('read errors use only this account cache and disable cloud overwrites', async () => {
  const { loader, storage, states } = setup(async () => { throw new Error('offline') })
  storage.setItem(profileKey('alice'), JSON.stringify([{ id: 'child-a', type: 'child' }]))
  await loader.load(bob)
  assert.equal(states.at(-1).canSaveRemote, false)
  assert.deepEqual(states.at(-1).profiles.map((p) => p.id), ['guardian_bob'])
})

test('active profile selection is isolated by user and validated', async () => {
  const { loader, storage, states } = setup()
  storage.setItem(activeKey('bob'), 'guardian_alice')
  await loader.load(bob)
  assert.equal(states.at(-1).activeProfileId, 'guardian_bob')
})

test('primary guardian name follows Firebase while legitimate child profiles survive', () => {
  const { profiles } = normalizeProfiles(alice, [
    { id: 'guardian_alice', type: 'guardian', isPrimary: true, name: 'Wrong name' },
    { id: 'child-a', type: 'child', name: 'Child A' },
  ])
  assert.equal(profiles[0].name, 'Alice (Guardian)')
  assert.equal(profiles[1].name, 'Child A')
})
