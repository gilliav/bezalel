

import { useEffect, useState } from 'react'
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useProject(projectId) {
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) return

    const unsubProject = onSnapshot(
      doc(db, 'projects', projectId),
      (snap) => {
        if (snap.exists()) setProject({ id: snap.id, ...snap.data() })
        setLoading(false)
      },
      (err) => { setError(err); setLoading(false) },
    )

    const unsubMilestones = onSnapshot(
      query(collection(db, 'projects', projectId, 'milestones'), orderBy('dueDate')),
      (snap) => setMilestones(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    )

    const unsubAttachments = onSnapshot(
      query(collection(db, 'projects', projectId, 'attachments'), orderBy('uploadedAt')),
      (snap) => setAttachments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    )

    return () => { unsubProject(); unsubMilestones(); unsubAttachments() }
  }, [projectId])

  return { project, milestones, attachments, loading, error }
}
