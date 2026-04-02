import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { getCourseColor } from '../utils/colors.js'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const COURSES = [
  {
    moodleId: '25029-1',
    name: 'טיפוגרפיה א׳',
    day: 'שני',
    hours: '10:00-13:00',
    lecturer: 'חופשי יהודה',
    location: 'סטודיו 135',
    courseUrl: '',
    notes: '',
  },
  {
    moodleId: '50107-10',
    name: 'תנועה',
    day: 'שני',
    hours: '14:00-17:00',
    lecturer: 'גביש ארז',
    location: 'סטודיו 135',
    courseUrl: '',
    notes: '',
  },
  {
    moodleId: '50137-1',
    name: 'איור א׳1',
    day: 'שלישי',
    hours: '10:00-13:00',
    lecturer: 'איתן אלוא',
    location: 'סטודיו 112',
    courseUrl: '',
    notes: '',
  },
  {
    moodleId: '50139-1',
    name: 'ממשק א׳1',
    day: 'שלישי',
    hours: '14:00-17:00',
    lecturer: 'הר-גב מיכל',
    location: 'סטודיו 112',
    courseUrl: '',
    notes: '',
  },
  {
    moodleId: '50136-1',
    name: 'מיומנויות דיגיטליות',
    day: 'רביעי',
    hours: '10:00-13:00',
    lecturer: 'רובינוביץ יסמין',
    location: 'סטודיו 112',
    courseUrl: '',
    notes: '7 שבועות ראשונים',
  },
  {
    moodleId: '50134-1',
    name: 'רישום 03 - צבע',
    day: 'רביעי',
    hours: '10:00-13:00',
    lecturer: 'טוביס אלכסנדר',
    location: 'כיתת רישום 212',
    courseUrl: '',
    notes: '7 שבועות אחרונים',
  },
  {
    moodleId: '50138-1',
    name: 'סטודיו זמן 02',
    day: 'חמישי',
    hours: '10:00-17:00',
    lecturer: 'צוות מרצים / גרי ענבל',
    location: 'סלון 138.1 / כיתה 2043',
    courseUrl: '',
    notes: '',
  },
]

async function seed() {
  const existing = await db.collection('courses').get()
  if (!existing.empty) {
    console.log('Courses already seeded. Exiting.')
    process.exit(0)
  }

  for (let i = 0; i < COURSES.length; i++) {
    const course = { ...COURSES[i], color: getCourseColor(i) }
    await db.collection('courses').add(course)
    console.log(`Seeded: ${course.name}`)
  }
  console.log('Done.')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
