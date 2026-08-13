import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useCatalogCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'catalogCourses'),
      (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
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
