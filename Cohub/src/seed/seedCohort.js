import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seed() {
  const coursesSnapshot = await db.collection('courses').get()

  if (coursesSnapshot.empty) {
    console.warn('Warning: No documents found in the courses collection. Writing cohort with empty courseIds.')
  }

  const courseIds = coursesSnapshot.docs.map(doc => doc.id)
  console.log(`Found ${courseIds.length} course(s):`, courseIds)

  const cohortRef = db.collection('cohorts').doc('cohort_viscom_2024_A1')
  await cohortRef.set({
    displayName: "א'1",
    department: 'visual_communication',
    year: 2024,
    courseIds,
  })

  console.log('Cohort document written to cohorts/cohort_viscom_2024_A1')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
