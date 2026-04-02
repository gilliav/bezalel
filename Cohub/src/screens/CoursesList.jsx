import { useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useCourses } from '../hooks/useCourses'
import { CourseCard } from '../components/CourseCard'

export default function CoursesList({ onError }) {
  const { courses, loading, error } = useCourses()

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

  if (loading) return <div className="p-4 text-right text-gray-400">טוען...</div>

  return (
    <div className="text-right">
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-bold">קורסים</h1>
      </div>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} onSave={handleSave} />
      ))}
    </div>
  )
}
