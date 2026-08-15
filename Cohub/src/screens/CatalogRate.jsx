import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useUserRatingStatus, submitRating, markNotTaken } from '../hooks/useCatalogRatings'
import { PageHeader } from '../components/PageHeader'
import { CourseChecklist } from '../components/Catalog/CourseChecklist'
import { SwipeCard } from '../components/Catalog/SwipeCard'

export default function CatalogRate({ onError }) {
  // Present only when mounted at /catalog/:courseId/rate (rating one course
  // directly from its detail page) — absent at /catalog/rate, which starts
  // with the take-courses checklist instead.
  const { courseId: startCourseId } = useParams()
  const navigate = useNavigate()
  const { uid, ready } = useCatalogAuth()
  const { courses, loading: coursesLoading } = useCatalogCourses()
  const { ratedCodes, notTakenCodes, loading: statusLoading } = useUserRatingStatus(uid)

  const [phase, setPhase] = useState(startCourseId ? 'deck' : 'checklist')
  const [queue, setQueue] = useState(startCourseId ? [startCourseId] : [])

  const excludeIds = useMemo(() => new Set([...ratedCodes, ...notTakenCodes]), [ratedCodes, notTakenCodes])

  useEffect(() => {
    if (phase === 'deck' && queue.length === 0) navigate('/catalog')
  }, [phase, queue.length, navigate])

  function handleChecklistDone(selectedIds) {
    setQueue(selectedIds)
    setPhase('deck')
  }

  async function handleSubmit(fields) {
    const courseId = queue[0]
    try {
      await submitRating({ uid, courseCode: courseId, ...fields })
      setQueue(q => q.filter(id => id !== courseId))
    } catch {
      onError?.('שגיאה בשמירת הדירוג')
    }
  }

  // handleNotTaken/handleSkip are dormant — SwipeCard only offers "אישור"
  // (rate and continue) or "ביטול" (cancel the whole session) for now, since
  // there's no login yet to reliably let a student revisit a checklist
  // mistake later. Kept here, ready to wire back into SwipeCard if that
  // changes.
  //
  // async function handleNotTaken() {
  //   const courseId = queue[0]
  //   try {
  //     await markNotTaken({ uid, courseCode: courseId })
  //     setQueue(q => q.filter(id => id !== courseId))
  //   } catch {
  //     onError?.('שגיאה בשמירה')
  //   }
  // }
  //
  // function handleSkip() {
  //   setQueue(q => (q.length <= 1 ? q : [...q.slice(1), q[0]]))
  // }

  function handleCancel() {
    navigate('/catalog')
  }

  if (!ready || coursesLoading || statusLoading) return <div className="state-loading">טוען...</div>

  if (phase === 'checklist') {
    return (
      <div className="text-right">
        <PageHeader title="אילו קורסים למדת?" />
        <CourseChecklist courses={courses} excludeIds={excludeIds} onDone={handleChecklistDone} />
      </div>
    )
  }

  const currentCourse = courses.find(c => c.id === queue[0])
  if (!currentCourse) return null

  return (
    <div className="text-right">
      <PageHeader title="דירוג קורסים" />
      <SwipeCard
        key={currentCourse.id}
        course={currentCourse}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
