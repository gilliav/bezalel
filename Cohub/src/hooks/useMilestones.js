import { useEffect, useState } from 'react'
import { collectionGroup, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useMilestones() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(collectionGroup(db, 'milestones'), orderBy('dueDate'))
    return onSnapshot(
      q,
      (snap) => {
        setMilestones(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        if (err.code === 'failed-precondition' || err.code === 'not-found') {
          setMilestones([])
          setLoading(false)
        } else {
          setError(err)
          setLoading(false)
        }
      },
    )
  }, [])

  return { milestones, loading, error }
}
