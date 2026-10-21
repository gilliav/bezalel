import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { isCurrentSemester } from '../utils/semester'
import { courseDayHe } from '../utils/dates'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'courses'),
      (snap) => {
        const all = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(isCurrentSemester)
        // Sort client-side: online courses (no day) go last, regular courses by day,
        // then by start time ('HH:MM-HH:MM' strings compare correctly as text)
        const DAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי']
        all.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return 1
          if (!a.isOnline && b.isOnline) return -1
          return DAY_ORDER.indexOf(courseDayHe(a.day)) - DAY_ORDER.indexOf(courseDayHe(b.day))
            || (a.hours ?? '').localeCompare(b.hours ?? '')
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
