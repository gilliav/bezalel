import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useAllCatalogRatings } from '../hooks/useCatalogRatings'
import { computeAggregate, groupRatingsByCourseCode } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { CourseListItem } from '../components/Catalog/CourseListItem'
import { EmptyState } from '../components/EmptyState'

export default function LecturerDetail({ onError }) {
  const { lecturerName } = useParams()
  const name = decodeURIComponent(lecturerName)
  const { ready, error: authError } = useCatalogAuth()
  const { courses, loading: coursesLoading, error: coursesError } = useCatalogCourses()
  const { ratings, loading: ratingsLoading, error: ratingsError } = useAllCatalogRatings()

  const ratingsByCourse = useMemo(() => groupRatingsByCourseCode(ratings), [ratings])
  const lecturerCourses = useMemo(() => courses.filter(c => c.lecturer === name), [courses, name])

  if (!ready || coursesLoading || ratingsLoading) return <div className="state-loading"/>

  return (
    <div className="text-right">
      <PageHeader title={name} hasBackButton />
      <div className="flex">
      {lecturerCourses.length === 0
        ? <EmptyState message="לא נמצאו קורסים" />
        : lecturerCourses.map(course => (
            <CourseListItem
              key={course.id}
              course={course}
              aggregate={computeAggregate(ratingsByCourse[course.id] ?? [])}
            />
          ))
      }
      </div>
    </div>
  )
}
