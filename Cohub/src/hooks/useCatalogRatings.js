import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export function useAllCatalogRatings() {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'catalogRatings'),
      (snap) => {
        setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [])

  return { ratings, loading, error }
}

export function useCourseRatings(courseCode) {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseCode) return
    const q = query(collection(db, 'catalogRatings'), where('courseCode', '==', courseCode))
    return onSnapshot(
      q,
      (snap) => {
        setRatings(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [courseCode])

  return { ratings, loading, error }
}

export function useUserRatingStatus(uid) {
  const [ratedCodes, setRatedCodes] = useState(new Set())
  const [notTakenCodes, setNotTakenCodes] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'catalogRatings'), where('uid', '==', uid))
    return onSnapshot(
      q,
      (snap) => {
        const rated = new Set()
        const notTaken = new Set()
        snap.docs.forEach(d => {
          const data = d.data()
          if (data.status === 'rated') rated.add(data.courseCode)
          if (data.status === 'notTaken') notTaken.add(data.courseCode)
        })
        setRatedCodes(rated)
        setNotTakenCodes(notTaken)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      },
    )
  }, [uid])

  return { ratedCodes, notTakenCodes, loading, error }
}

export async function submitRating({
  uid, courseCode, recommend, profGood, difficulty, interesting, workload, attendanceTaken, comment,
}) {
  await setDoc(doc(db, 'catalogRatings', `${uid}_${courseCode}`), {
    courseCode,
    uid,
    status: 'rated',
    recommend,
    profGood: profGood ?? null,
    difficulty: difficulty ?? null,
    interesting: interesting ?? null,
    workload: workload ?? null,
    attendanceTaken: attendanceTaken ?? null,
    comment: comment ?? '',
    createdAt: serverTimestamp(),
  })
}

export async function markNotTaken({ uid, courseCode }) {
  await setDoc(doc(db, 'catalogRatings', `${uid}_${courseCode}`), {
    courseCode,
    uid,
    status: 'notTaken',
    createdAt: serverTimestamp(),
  })
}
