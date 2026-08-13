import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useCourseRatings } from '../hooks/useCatalogRatings'
import { computeAggregate } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'

export default function CatalogDetail({ onError }) {
  const { courseId } = useParams()
  const { ready, error: authError } = useCatalogAuth()
  const { courses, loading: coursesLoading, error: coursesError } = useCatalogCourses()
  const { ratings, loading: ratingsLoading, error: ratingsError } = useCourseRatings(courseId)

  useEffect(() => {
    if (authError) onError?.('שגיאה בהתחברות')
  }, [authError, onError])

  useEffect(() => {
    if (coursesError || ratingsError) onError?.('שגיאה בטעינת הקורס')
  }, [coursesError, ratingsError, onError])

  const course = courses.find(c => c.id === courseId)

  if (!ready || coursesLoading || ratingsLoading || !course) return <div className="state-loading">טוען...</div>

  const aggregate = computeAggregate(ratings)
  const comments = ratings.filter(r => r.status === 'rated' && r.comment)

  return (
    <div className="text-right">
      <PageHeader title={course.name} />
      <div className="px-4 pt-3">
        <Link to="/catalog" className="text-muted-foreground flex items-center gap-0.5 text-sm">
          <ChevronRight size={16} />
          חזרה לקטלוג
        </Link>
      </div>

      <div className="page-body border-b border-border pb-4">
        <div className="flex flex-col gap-1 text-sm">
          <div>{course.lecturer}</div>
          <div className="text-muted-foreground">
            {course.category}
            {course.semester && ` · ${course.semester === 'שנתי' ? 'שנתי' : `סמסטר ${course.semester}`}`}
          </div>
          {course.day && <div className="text-muted-foreground">{course.day} · {course.hours}</div>}
          {course.credits && (
            <div className="text-muted-foreground">{course.credits?.weeklyHours} ש"ס · {course.credits?.points} נ"ז</div>
          )}
        </div>
        <p className="text-base">{course.description}</p>
      </div>

      <div className="page-body border-b border-border pb-4">
        <h2 className="mb-2">דירוגים</h2>
        {aggregate.count === 0 ? (
          <div className="text-muted-foreground text-sm">אין דירוגים עדיין</div>
        ) : (
          <div className="flex flex-col gap-1 text-sm">
            <div>{aggregate.recommendPercent}% ממליצים · {aggregate.count} דירוגים</div>
            {aggregate.profGood !== null && <div>איכות הוראה: {aggregate.profGood.toFixed(1)}/5</div>}
            {aggregate.difficulty !== null && <div>קושי: {aggregate.difficulty.toFixed(1)}/5</div>}
            {aggregate.interesting !== null && <div>מעניין: {aggregate.interesting.toFixed(1)}/5</div>}
            {aggregate.workload !== null && <div>עומס: {aggregate.workload.toFixed(1)}/5</div>}
            {aggregate.attendanceTakenPercent !== null && <div>נוכחות נבדקת: {aggregate.attendanceTakenPercent}%</div>}
          </div>
        )}
        <Link to={`/catalog/rate?start=${course.id}`}>
          <Button size="sm" className="mt-3">דרג/י את הקורס</Button>
        </Link>
      </div>

      {comments.length > 0 && (
        <div className="page-body">
          <h2 className="mb-2">תגובות</h2>
          <div className="flex flex-col gap-3">
            {comments.map(r => (
              <div key={r.id} className="text-sm text-foreground">{r.comment}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
