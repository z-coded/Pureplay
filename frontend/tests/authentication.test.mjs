import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SourceTextModule, SyntheticModule } from 'node:vm'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { transformWithOxc } from 'vite'
import * as accountSession from '../src/lib/accountSession.js'

const source = await readFile(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8')
const compiled = await transformWithOxc(source, 'AuthContext.jsx', { jsx: { runtime: 'automatic' } })

async function authActions(errorCode, configured = true) {
  const failure = Object.assign(new Error(errorCode), { code: errorCode })
  const reject = async () => { throw failure }
  const unexpected = () => { throw new Error('Failed authentication must not create a user document') }
  const imports = {
    react: React,
    'react/jsx-runtime': jsxRuntime,
    'firebase/auth': {
      GoogleAuthProvider: class { setCustomParameters() {} },
      createUserWithEmailAndPassword: reject,
      onAuthStateChanged() {},
      sendEmailVerification: unexpected,
      sendPasswordResetEmail: reject,
      signInWithEmailAndPassword: reject,
      signInWithPopup: reject,
      signOut() {},
      updateProfile: unexpected,
    },
    'firebase/firestore': { doc() {}, getDoc() {}, setDoc: unexpected },
    '../firebase/config.js': { auth: configured ? {} : null, db: {}, isFirebaseConfigured: configured },
    '../data/mockData.js': { defaultPolicy: {} },
    '../lib/adminStorage.js': { ensureUserDocument: unexpected },
    '../lib/accountSession.js': accountSession,
  }
  const module = new SourceTextModule(compiled.code, {
    initializeImportMeta(meta) { meta.env = {} },
  })
  await module.link((specifier) => {
    const exports = imports[specifier]
    assert.ok(exports, `Unexpected import: ${specifier}`)
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value)
    })
  })
  await module.evaluate()
  let actions
  function Probe() {
    actions = module.namespace.useAuth()
    return null
  }
  renderToStaticMarkup(React.createElement(module.namespace.AuthProvider, null, React.createElement(Probe)))
  return { actions, failure }
}

for (const code of ['auth/invalid-credential', 'auth/user-not-found', 'auth/operation-not-allowed']) {
  test(`${code} remains a login error instead of becoming a local session`, async () => {
    const { actions, failure } = await authActions(code)
    await assert.rejects(actions.logIn('test@example.test', 'bad-password'), (e) => e === failure)
    assert.equal(actions.user, null)
    assert.equal(actions.demoLogin, undefined)
  })
}

test('disabled registration does not create a synthetic account', async () => {
  const { actions, failure } = await authActions('auth/operation-not-allowed')
  await assert.rejects(actions.signUp('test@example.test', 'password', 'Test'), (e) => e === failure)
})

test('unauthorized Google sign-in does not fall back to a guardian session', async () => {
  const { actions, failure } = await authActions('auth/unauthorized-domain')
  await assert.rejects(actions.signInWithGoogle(), (e) => e === failure)
})

test('unconfigured Firebase refuses all login and registration methods', async () => {
  const { actions } = await authActions('unused', false)
  await assert.rejects(actions.logIn('a@example.test', 'password'), /not configured/)
  await assert.rejects(actions.signUp('a@example.test', 'password'), /not configured/)
  await assert.rejects(actions.signInWithGoogle(), /not configured/)
})
