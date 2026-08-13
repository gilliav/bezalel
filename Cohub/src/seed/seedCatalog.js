import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { CATALOG_COURSES } from './catalogCourseData.js'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seed() {
  const existing = await db.collection('catalogCourses').get()
  if (!existing.empty) {
    console.log('Catalog already seeded. Exiting.')
    process.exit(0)
  }

  // Some course codes are genuinely reused across different courses in the
  // source shnaton (see the data-quality notes at the top of
  // catalogCourseData.js) — disambiguate any repeat into its own doc ID.
  const seen = new Map()
  for (const course of CATALOG_COURSES) {
    const occurrence = (seen.get(course.courseCode) ?? 0) + 1
    seen.set(course.courseCode, occurrence)
    const docId = occurrence === 1 ? course.courseCode : `${course.courseCode}-dup${occurrence}`
    await db.collection('catalogCourses').doc(docId).set(course)
    console.log(`Seeded: ${docId} — ${course.name}`)
  }
  console.log(`Done. Seeded ${CATALOG_COURSES.length} courses.`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
