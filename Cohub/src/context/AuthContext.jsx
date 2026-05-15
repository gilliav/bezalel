// src/context/AuthContext.jsx
import { createContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

const COHORT_ID = 'cohort_viscom_2026_A1'

async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data().role ?? null

  // First login — seed user document with A1 defaults
  const cohortSnap = await getDoc(doc(db, 'cohorts', COHORT_ID))
  const courseIds = cohortSnap.exists() ? cohortSnap.data().courseIds : []

  await setDoc(ref, {
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    cohortId: COHORT_ID,
    department: 'visual_communication',
    yearIndex: 1,
    courseIds,
    createdAt: serverTimestamp(),
  })
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let mounted = true
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const role = await ensureUserDoc(firebaseUser)
          if (mounted) setIsAdmin(role === 'admin')
        } catch (err) {
          console.error('ensureUserDoc failed:', err)
        }
        if (mounted) setUser(firebaseUser)
      } else {
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
        }
      }
    })
    return () => { mounted = false; unsub() }
  }, [])

  function signIn() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  function signOutUser() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
