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
  if (snap.exists()) return

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
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = signed out

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await ensureUserDoc(firebaseUser)
        setUser(firebaseUser)
      } else {
        setUser(null)
      }
    })
  }, [])

  function signIn() {
    return signInWithPopup(auth, new GoogleAuthProvider())
  }

  function signOutUser() {
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
