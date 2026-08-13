export function computeAggregate(ratings) {
  const rated = ratings.filter(r => r.status === 'rated')
  const count = rated.length

  if (count === 0) {
    return {
      count: 0,
      recommendPercent: null,
      profGood: null,
      difficulty: null,
      interesting: null,
      workload: null,
      attendanceTakenPercent: null,
    }
  }

  const avg = (key) => {
    const values = rated.map(r => r[key]).filter(v => typeof v === 'number')
    if (values.length === 0) return null
    return values.reduce((sum, v) => sum + v, 0) / values.length
  }

  const recommendCount = rated.filter(r => r.recommend === true).length
  const attendanceEntries = rated.filter(r => typeof r.attendanceTaken === 'boolean')
  const attendanceTrueCount = attendanceEntries.filter(r => r.attendanceTaken === true).length

  return {
    count,
    recommendPercent: Math.round((recommendCount / count) * 100),
    profGood: avg('profGood'),
    difficulty: avg('difficulty'),
    interesting: avg('interesting'),
    workload: avg('workload'),
    attendanceTakenPercent: attendanceEntries.length > 0
      ? Math.round((attendanceTrueCount / attendanceEntries.length) * 100)
      : null,
  }
}

export function groupRatingsByCourseCode(ratings) {
  const map = {}
  for (const rating of ratings) {
    if (!map[rating.courseCode]) map[rating.courseCode] = []
    map[rating.courseCode].push(rating)
  }
  return map
}
