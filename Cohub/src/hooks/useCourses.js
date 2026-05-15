import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'courses'),
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        // Sort client-side: online courses (no day) go last, regular courses by day
        const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']
        all.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return 1
          if (!a.isOnline && b.isOnline) return -1
          return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
        })
        setCourses(all)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [])

  return { courses, loading, error }
}
