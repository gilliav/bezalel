import { useMemo, useState } from 'react'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useAllCatalogRatings } from '../hooks/useCatalogRatings'
import { computeAggregate, groupRatingsByCourseCode } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Input } from '../components/ui/input'
import { CourseListItem } from '../components/Catalog/CourseListItem'

export default function CatalogList() {
  const { courses, loading: coursesLoading } = useCatalogCourses()
  const { ratings, loading: ratingsLoading } = useAllCatalogRatings()
  const [search, setSearch] = useState('')

  const ratingsByCourse = useMemo(() => groupRatingsByCourseCode(ratings), [ratings])

  const filteredCourses = useMemo(() => {
    const term = search.trim()
    if (!term) return courses
    return courses.filter(c => c.name.includes(term) || c.lecturer?.includes(term))
  }, [courses, search])

  if (coursesLoading || ratingsLoading) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right">
      <PageHeader title="קטלוג קורסים" />
      <div className="page-body pb-0">
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם קורס או מרצה"
        />
      </div>
      {filteredCourses.length === 0
        ? <EmptyState message="לא נמצאו קורסים" />
        : filteredCourses.map(course => (
            <CourseListItem
              key={course.id}
              course={course}
              aggregate={computeAggregate(ratingsByCourse[course.id] ?? [])}
            />
          ))
      }
    </div>
  )
}
