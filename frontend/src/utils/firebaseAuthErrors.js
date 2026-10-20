/** Maps Firebase Auth error codes to readable messages. */
export function getFirebaseAuthMessage(error) {
  if (!error) return 'Something went wrong. Try again.'
  const code = error.code ?? ''

  const map = {
    'auth/invalid-email': 'That email address doesn’t look valid.',
    'auth/email-already-in-use': 'That email is already registered. Try logging in.',
    'auth/weak-password':
      'Password is too weak. Use at least 6 characters; longer mixes of letters, numbers, and symbols work best.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Wrong password. Try again or reset your password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Wait a bit and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups for this site and try again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with this email using a different sign-in method.',
    'auth/operation-not-allowed':
      'This sign-in method isn’t enabled in Firebase. In Firebase Console → Authentication → Sign-in method, enable Email/Password and Google.',
  }

  return map[code] ?? error.message ?? 'Something went wrong. Try again.'
}
