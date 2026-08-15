import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useCourseRatings } from '../hooks/useCatalogRatings'
import { computeAggregate, getAttendanceLabel } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'

const ATTENDANCE_COLOR = {
  'כן': 'var(--rating-positive)',
  'לא ברור': 'var(--rating-neutral)',
  'לא': 'var(--rating-negative)',
}

function StatCard({ label, value }) {
  return (
    <div className="border border-border rounded-lg py-2 px-3 text-center bg-card">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center justify-center gap-1 font-bold" style={{ color: 'var(--rating-star)' }}>
        <Star size={14} fill="currentColor" />
        {value !== null ? value.toFixed(1) : '--'}
      </div>
    </div>
  )
}

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
  const attendanceLabel = getAttendanceLabel(aggregate.attendanceTakenPercent)

  return (
    <div className="text-right">
      <PageHeader title={course.name} hasBackButton />

      <div className="page-body border-b border-border pb-4">
        <div className="flex flex-col gap-1 text-sm">
          <Link
            to={`/lecturer/${encodeURIComponent(course.lecturer)}`}
            className="action-link underline decoration-1 underline-offset-2 w-fit"
          >
            {course.lecturer}
          </Link>
          {course.credits && (
            <div className="text-muted-foreground">{course.credits?.weeklyHours} ש"ס · {course.credits?.points} נ"ז</div>
          )}
        </div>
        <p className="text-base">{course.description}</p>

        <Link to={`/catalog/${course.id}/rate`}>
          <Button className="w-full mt-2">דרג/י את הקורס</Button>
        </Link>
      </div>

      <div className="page-body border-b border-border pb-4">
        <h2 className="mb-2">דירוגים</h2>
        {aggregate.count === 0 ? (
          <div className="text-center py-4">
            <p>אין דירוגים עדיין</p>
            <p className="text-caption mt-1">
              למדת את הקורס?{' '}
              <Link to={`/catalog/${course.id}/rate`} className="action-link underline decoration-1 underline-offset-2">
                תוסיפ.י דירוג כאן
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex flex-col items-center rounded-lg py-4 text-white"
              style={{ backgroundColor: 'var(--rating-positive)' }}
            >
              <span className="text-3xl font-extrabold">
                {aggregate.recommendPercent !== null ? `${aggregate.recommendPercent}%` : '--'}
              </span>
              <span className="text-sm opacity-90">ממליצים · {aggregate.count} דירוגים</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <StatCard label="איכות ההוראה" value={aggregate.profGood} />
              <StatCard label="רמת הקושי" value={aggregate.difficulty} />
              <StatCard label="עניין" value={aggregate.interesting} />
              <StatCard label="עומס העבודה" value={aggregate.workload} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 mt-2 text-sm">
              <span className="text-muted-foreground">נוכחות נבדקת</span>
              <span className="flex items-center gap-1.5">
                <span className="font-semibold" style={{ color: attendanceLabel ? ATTENDANCE_COLOR[attendanceLabel] : undefined }}>
                  {attendanceLabel ?? '--'}
                </span>
                {aggregate.attendanceTakenPercent !== null && (
                  <span className="text-caption text-xs">({aggregate.attendanceTakenPercent}%)</span>
                )}
              </span>
            </div>
          </>
        )}
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
