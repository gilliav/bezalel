import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Replace with Gilli's actual Firebase Auth UID
const ADMIN_UID = 'REPLACE_WITH_YOUR_UID'

async function setAdminRole() {
  const ref = db.collection('users').doc(ADMIN_UID)
  const snap = await ref.get()

  if (!snap.exists) {
    console.error(`No user doc found for UID: ${ADMIN_UID}. Log in to the app first.`)
    process.exit(1)
  }

  await ref.update({ role: 'admin' })
  console.log(`Done. ${ADMIN_UID} is now an admin.`)
  process.exit(0)
}

setAdminRole().catch(err => { console.error(err); process.exit(1) })
