import { useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useCourseRatings, submitRating } from '../hooks/useCatalogRatings'
import { computeAggregate, getAttendanceLabel, getLoadBucket } from '../utils/catalogAggregate'
import { formatDateShort } from '../utils/dates'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/button'
import { SwipeCard } from '../components/Catalog/SwipeCard'

const ATTENDANCE_COLOR = {
  'כן': 'var(--rating-positive)',
  'לא ברור': 'var(--rating-neutral)',
  'לא': 'var(--rating-negative)',
}

function StatCard({ label, value, bucket, testId }) {
  return (
    <div
      className="border border-border rounded-lg py-2 px-3 text-center bg-card"
      data-testid={testId ? `stat-${testId}` : undefined}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-bold" style={{ color: 'var(--foreground)' }}>
        <span>{value !== null ? value.toFixed(1) : '--'}</span>
        <span className="text-xs font-normal text-muted-foreground">/5</span>
      </div>
      {bucket && (
        <span
          className="font-display inline-block text-xs font-bold mt-1 px-2 py-0.5"
          style={{ color: bucket.colorVar, backgroundColor: `color-mix(in srgb, ${bucket.colorVar} 16%, transparent)` }}
        >
          {bucket.label}
        </span>
      )}
    </div>
  )
}

function ReviewStat({ label, value, heavyLabel }) {
  if (value == null) return null
  if (heavyLabel) {
    const bucket = getLoadBucket(value, heavyLabel)
    return (
      <span className="flex items-center gap-1">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-semibold" style={{ color: bucket.colorVar }}>{bucket.label}</span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1">
      <span className="text-muted-foreground">{label}:</span>
      {value}
      /5
    </span>
  )
}

function ReviewCard({ review }) {
  return (
    <div
      data-testid={`review-${review.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>אנונימי</span>
        {review.createdAt && <span>{formatDateShort(review.createdAt)}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {review.recommend != null && (
          <span className="flex items-center gap-1 font-semibold" style={{ color: review.recommend ? 'var(--rating-positive)' : 'var(--rating-negative)' }}>
            {review.recommend ? <ThumbsUp size={14} fill="currentColor" /> : <ThumbsDown size={14} fill="currentColor" />}
            {review.recommend ? 'ממליץ/ה' : 'לא ממליץ/ה'}
          </span>
        )}
        <ReviewStat label="הוראה" value={review.profGood} />
        <ReviewStat label="רמת קושי" value={review.difficulty} heavyLabel="קשה" />
        <ReviewStat label="עניין" value={review.interesting} />
        <ReviewStat label="עומס" value={review.workload} heavyLabel="כבד" />
        {review.attendanceTaken != null && (
          <span className="flex items-center gap-1 text-muted-foreground">
            נוכחות נבדקת?:
            <span className="font-semibold" style={{ color: review.attendanceTaken ? 'var(--rating-positive)' : 'var(--rating-negative)' }}>
              {review.attendanceTaken ? 'כן' : 'לא'}
            </span>
          </span>
        )}
      </div>
      {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
    </div>
  )
}

export default function CatalogDetail({ onError }) {
  const { courseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { uid, ready, error: authError } = useCatalogAuth()
  const { courses, loading: coursesLoading, error: coursesError } = useCatalogCourses()
  const { ratings, loading: ratingsLoading, error: ratingsError } = useCourseRatings(courseId)

  useEffect(() => {
    if (authError) onError?.('שגיאה בהתחברות')
  }, [authError, onError])

  useEffect(() => {
    if (coursesError || ratingsError) onError?.('שגיאה בטעינת הקורס')
  }, [coursesError, ratingsError, onError])

  const course = courses.find(c => c.id === courseId)
  const isRating = location.pathname.endsWith('/rate')

  if (!ready || coursesLoading || ratingsLoading || !course) return <div className="state-loading">טוען...</div>

  async function handleRateSubmit(fields) {
    try {
      await submitRating({ uid, courseCode: course.id, ...fields })
      navigate(`/catalog/${course.id}`)
    } catch {
      onError?.('שגיאה בשמירת הדירוג')
    }
  }

  function handleRateCancel() {
    navigate(`/catalog/${course.id}`)
  }

  const aggregate = computeAggregate(ratings)
  const reviews = ratings.filter(r => r.status === 'rated')
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

        {isRating ? (
          <div className="mt-2">
            <SwipeCard course={course} onSubmit={handleRateSubmit} onCancel={handleRateCancel} showCourseInfo={false} />
          </div>
        ) : (
          <Link to={`/catalog/${course.id}/rate`}>
            <Button className="w-full mt-2">דרג/י את הקורס</Button>
          </Link>
        )}
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
              <StatCard label="איכות ההוראה" value={aggregate.profGood} testId="profGood" />
              <StatCard label="רמת הקושי" value={aggregate.difficulty} bucket={getLoadBucket(aggregate.difficulty, 'קשה')} testId="difficulty" />
              <StatCard label="עניין" value={aggregate.interesting} testId="interesting" />
              <StatCard label="עומס העבודה" value={aggregate.workload} bucket={getLoadBucket(aggregate.workload, 'כבד')} testId="workload" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 mt-2 text-sm">
              <span className="text-muted-foreground">נוכחות נבדקת?</span>
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

      {reviews.length > 0 && (
        <div className="page-body">
          <h2 className="mb-2">חוות דעת</h2>
          <div className="flex flex-col gap-3">
            {reviews.map(r => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
