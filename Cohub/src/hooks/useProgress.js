import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function progressDocId(uid, itemId) {
  return `${uid}_${itemId}`
}

export function nextStatus(current) {
  if (current === 'not_started') return 'in_progress'
  if (current === 'in_progress') return 'done'
  return 'not_started'
}

// Returns a map of itemId → status for the current user.
// Items with no Firestore document are implicitly 'not_started'.
export function useProgress(uid) {
  const [progressMap, setProgressMap] = useState({})

  useEffect(() => {
    if (!uid) {
      setProgressMap({})
      return
    }

    const q = query(collection(db, 'progress'), where('uid', '==', uid))
    return onSnapshot(q, (snap) => {
      const map = {}
      snap.docs.forEach(d => {
        map[d.data().itemId] = d.data().status
      })
      setProgressMap(map)
    })
  }, [uid])

  async function cycleProgress(itemId, itemType) {
    if (!uid) return
    const current = progressMap[itemId] ?? 'not_started'
    const next = nextStatus(current)
    const ref = doc(db, 'progress', progressDocId(uid, itemId))

    if (next === 'not_started') {
      await deleteDoc(ref)
    } else {
      await setDoc(ref, { uid, itemId, itemType, status: next, updatedAt: serverTimestamp() })
    }
  }

  return { progressMap, cycleProgress }
}
