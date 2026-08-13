import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase'

export function useCatalogAuth() {
  const [uid, setUid] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        signInAnonymously(auth).catch((err) => setError(err))
      }
    })
    return unsub
  }, [])

  return { uid, ready: uid !== null, error }
}
