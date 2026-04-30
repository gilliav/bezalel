import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const COHORT_ID = 'cohort_viscom_2026_A1'

async function seed() {
  const cohortRef = db.collection('cohorts').doc(COHORT_ID)

  const existing = await cohortRef.get()
  if (existing.exists) {
    console.log('Cohort already seeded. Exiting.')
    process.exit(0)
  }

  const coursesSnapshot = await db.collection('courses').get()

  // All courses in the collection belong to cohort A1
  const courseIds = coursesSnapshot.docs.map(doc => doc.id)

  if (courseIds.length === 0) {
    console.error('No courses found in Firestore. Aborting — run seedCourses first.')
    process.exit(1)
  }

  console.log(`Found ${courseIds.length} course(s):`, courseIds)

  await cohortRef.set({
    displayName: "א'1",
    department: 'visual_communication',
    year: 2026,
    courseIds,
  })

  console.log(`Cohort document written to cohorts/${COHORT_ID}`)
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
