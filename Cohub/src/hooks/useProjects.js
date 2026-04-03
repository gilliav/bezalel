import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useProjects(courseId) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseId) return
    const q = query(
      collection(db, 'projects'),
      where('courseId', '==', courseId),
      orderBy('createdAt'),
    )
    return onSnapshot(
      q,
      (snap) => {
        setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [courseId])

  return { projects, loading, error }
}

export function useAllProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt'))
    return onSnapshot(
      q,
      (snap) => {
        setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [])

  return { projects, loading, error }
}
