import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../hooks/useAuth'
import { CourseCard } from '../components/CourseCard'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { AddCourseForm } from '../components/AddCourseForm'

export default function CoursesList({ onError }) {
  const { courses, loading, error } = useCourses()
  const { isAdmin } = useAuth()
  const [addingCourse, setAddingCourse] = useState(false)

  useEffect(() => {
    if (error) onError?.('שגיאה בטעינת הקורסים')
  }, [error, onError])

  async function handleSave(course) {
    try {
      await updateDoc(doc(db, 'courses', course.id), {
        courseUrl: course.courseUrl,
        notes: course.notes,
      })
    } catch {
      onError?.('שגיאה בשמירת הקורס')
    }
  }

  if (loading) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right">
      <PageHeader
        title="קורסים"
        action={
          isAdmin && !addingCourse ? (
            <button
              onClick={() => setAddingCourse(true)}
              className="action-link text-sm"
            >
              + קורס חדש
            </button>
          ) : null
        }
      />

      {addingCourse && (
        <AddCourseForm
          courses={courses}
          onClose={() => setAddingCourse(false)}
          onError={onError}
        />
      )}

      {courses.length === 0
        ? <EmptyState message="אין קורסים" />
        : courses.map(course => (
            <CourseCard key={course.id} course={course} onSave={handleSave} />
          ))
      }
    </div>
  )
}
