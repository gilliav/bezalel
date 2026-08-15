import { useEffect, useMemo, useState } from 'react'
import { useCatalogAuth } from '../hooks/useCatalogAuth'
import { useCatalogCourses } from '../hooks/useCatalogCourses'
import { useAllCatalogRatings } from '../hooks/useCatalogRatings'
import { computeAggregate, groupRatingsByCourseCode } from '../utils/catalogAggregate'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { CourseListItem } from '../components/Catalog/CourseListItem'

const SORT_OPTIONS = [
  { key: 'name', label: 'שם (א-ת)', dirIcon: ArrowUp },
  { key: 'name-reverse', label: 'שם (א-ת)', dirIcon: ArrowDown },
  { key: 'recommend', label: 'מומלץ ביותר', dirIcon: ArrowDown },
  { key: 'profGood', label: 'דירוג מרצה', dirIcon: ArrowDown },
  { key: 'count', label: 'הכי הרבה דירוגים', dirIcon: ArrowDown },
]

const AGGREGATE_KEY_BY_SORT = {
  recommend: 'recommendPercent',
  profGood: 'profGood',
  count: 'count',
}

export default function CatalogList({ onError }) {
  const { ready, error: authError } = useCatalogAuth()
  const { courses, loading: coursesLoading, error: coursesError } = useCatalogCourses()
  const { ratings, loading: ratingsLoading, error: ratingsError } = useAllCatalogRatings()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('count')

  useEffect(() => {
    if (authError) onError?.('שגיאה בהתחברות')
  }, [authError, onError])

  useEffect(() => {
    if (coursesError || ratingsError) onError?.('שגיאה בטעינת הקטלוג')
  }, [coursesError, ratingsError, onError])

  const ratingsByCourse = useMemo(() => groupRatingsByCourseCode(ratings), [ratings])

  const aggregatesByCourse = useMemo(() => {
    const map = {}
    for (const course of courses) {
      map[course.id] = computeAggregate(ratingsByCourse[course.id] ?? [])
    }
    return map
  }, [courses, ratingsByCourse])

  const filteredCourses = useMemo(() => {
    const term = search.trim()
    if (!term) return courses
    return courses.filter(c => c.name.includes(term) || c.lecturer?.includes(term))
  }, [courses, search])

  const sortedCourses = useMemo(() => {
    const byName = (a, b) => a.name.localeCompare(b.name)
    const list = [...filteredCourses]

    if (sortBy === 'name') return list.sort(byName)
    if (sortBy === 'name-reverse') return list.sort(byName).reverse()

    const metricKey = AGGREGATE_KEY_BY_SORT[sortBy]
    return list.sort((a, b) => {
      const aAgg = aggregatesByCourse[a.id]
      const bAgg = aggregatesByCourse[b.id]
      if (aAgg.count === 0 && bAgg.count === 0) return byName(a, b)
      if (aAgg.count === 0) return 1
      if (bAgg.count === 0) return -1
      return bAgg[metricKey] - aAgg[metricKey]
    })
  }, [filteredCourses, sortBy, aggregatesByCourse])

  const currentSortOption = SORT_OPTIONS.find(option => option.key === sortBy) ?? SORT_OPTIONS[0]

  if (!ready || coursesLoading || ratingsLoading) return <div className="state-loading">טוען...</div>

  return (
    <div className="text-right max-w-6xl mx-auto">
      <PageHeader title="קטלוג קורסים" />
      <div className="page-body pb-0 flex flex-col sm:flex-row gap-2">
        <Input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם קורס או מרצה"
          className="flex-1"
        />
        <Select value={sortBy} onValueChange={setSortBy} dir="rtl">
          <SelectTrigger className="w-auto h-9 gap-1.5 px-2.5 shrink-0">
            <ArrowUpDown size={14} className="shrink-0 text-muted-foreground" />
            <span className="text-sm whitespace-nowrap">{currentSortOption.label}</span>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.key} value={option.key}>
                <span className="flex items-center gap-2">
                  <option.dirIcon size={14} className="text-muted-foreground" />
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {sortedCourses.length === 0 ? (
        <EmptyState message="לא נמצאו קורסים" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-4 py-4">
          {sortedCourses.map(course => (
            <CourseListItem
              key={course.id}
              course={course}
              aggregate={aggregatesByCourse[course.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
