import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { getCourseColor } from '../utils/colors.js'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const SEMESTER = 'ב1'

// Practical courses only — theory (עיוני) courses are per-student, same as א1.
// Source: Notion "University Hub / קורסים" (סמסטר = ב1, סוג = מעשי).
// notionId keys each course so re-running updates in place instead of duplicating.
// day: 0 = Sunday
const COURSES = [
  { notionId: '3fc1549db2dc810fb9eddb84eb94f534', name: 'גריד', day: 1, hours: '10:00-13:00', lecturer: 'פרופ׳ קציר ענת', location: 'סטודיו 135', credits: 2, notes: '',
    courseUrl: 'https://drive.google.com/drive/folders/1xgYN7N_5JnjIShFEmhthSITGPDUJw9ql',
    driveUrl: 'https://drive.google.com/drive/folders/1xgYN7N_5JnjIShFEmhthSITGPDUJw9ql',
    miroUrl: 'https://miro.com/app/board/uXjVHkcVQrs=/' },
  { notionId: '3fc1549db2dc81f0a32fee4a7919eb87', name: 'משחקיות', day: 1, hours: '14:00-17:00', lecturer: 'שכטר פנחס', location: 'סטודיו 114', credits: 2, notes: '' },
  { notionId: '3fc1549db2dc815f9de1fe4219950fed', name: 'רישום 03 - עיצוב (ספרינט)', day: 2, hours: '10:00-13:00', lecturer: 'אתגר שרון', location: 'כיתת רישום 1056', credits: 1, notes: '7 שבועות ראשונים' },
  { notionId: '3fc1549db2dc812fa3bcfb3732624e37', name: 'דימוי', day: 2, hours: '14:00-17:00', lecturer: 'גיגר נעמי', location: 'כיתה 132', credits: 2, notes: '' },
  { notionId: '3fc1549db2dc8198b94ce588a38dbc92', name: 'סטודיו 03', day: 3, hours: '10:00-13:00', lecturer: 'ביכובסקי ארנסטו', location: 'כיתה 132', credits: 3, notes: '' },
  { notionId: '3fc1549db2dc81b29ae2eb92446040e8', name: 'סיפור', day: 4, hours: '10:00-13:00', lecturer: 'גלעד אמיתי', location: 'סטודיו 112', credits: 2, notes: '' },
]

async function seed() {
  const existing = await db.collection('courses').where('semester', '==', SEMESTER).get()
  const byNotionId = new Map(existing.docs.map(d => [d.data().notionId, d]))

  for (let i = 0; i < COURSES.length; i++) {
    const course = { moodleId: '', courseUrl: '', isOnline: false, ...COURSES[i], semester: SEMESTER }
    const doc = byNotionId.get(course.notionId)
    if (doc) {
      // Keep the color the user may have picked in the app
      await doc.ref.set(course, { merge: true })
      console.log(`Updated: ${course.name}`)
    } else {
      await db.collection('courses').add({ ...course, color: getCourseColor(i) })
      console.log(`Seeded: ${course.name}`)
    }
  }
  console.log('Done.')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
