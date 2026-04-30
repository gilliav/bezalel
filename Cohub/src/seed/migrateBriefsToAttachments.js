import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('../../serviceAccountKey.json')

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
})

const db = getFirestore()
const bucket = getStorage().bucket()

async function copyStorageFile(oldPath, newPath) {
  const oldFile = bucket.file(oldPath)
  const [exists] = await oldFile.exists()
  if (!exists) {
    console.warn(`  Storage file not found: ${oldPath}`)
    return
  }
  await oldFile.copy(bucket.file(newPath))
  await oldFile.delete()
  console.log(`  Storage: ${oldPath} → ${newPath}`)
}

async function migrate() {
  const projectsSnap = await db.collection('projects').get()
  console.log(`Found ${projectsSnap.size} projects`)

  for (const projectDoc of projectsSnap.docs) {
    const projectId = projectDoc.id
    const briefsSnap = await db
      .collection('projects').doc(projectId).collection('briefs')
      .orderBy('uploadedAt')
      .get()

    if (briefsSnap.empty) continue

    console.log(`\nProject ${projectId}: ${briefsSnap.size} brief(s)`)

    for (const briefDoc of briefsSnap.docs) {
      const data = briefDoc.data()

      // Copy Firestore doc to attachments subcollection
      await db
        .collection('projects')
        .doc(projectId)
        .collection('attachments')
        .doc(briefDoc.id)
        .set(data)

      // Move Storage file if fileUrl points to our bucket
      if (data.fileUrl) {
        try {
          const url = new URL(data.fileUrl)
          // Extract path from URL like:
          // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-path>?...
          const match = url.pathname.match(/\/o\/(.+)$/)
          if (match) {
            const oldPath = decodeURIComponent(match[1])
            const newPath = oldPath.replace(/^briefs\//, 'attachments/')
            if (oldPath !== newPath) {
              await copyStorageFile(oldPath, newPath)

              // Update the fileUrl in the new doc with the new download URL
              const newFile = bucket.file(newPath)
              const [newUrl] = await newFile.getSignedUrl({
                action: 'read',
                expires: '03-01-2500',
              })
              await db
                .collection('projects')
                .doc(projectId)
                .collection('attachments')
                .doc(briefDoc.id)
                .update({ fileUrl: newUrl })
            }
          }
        } catch (err) {
          console.warn(`  Could not migrate storage for doc ${briefDoc.id}: ${err.message}`)
        }
      }

      // Delete old Firestore doc
      await briefDoc.ref.delete()
      console.log(`  Firestore doc ${briefDoc.id} moved`)
    }
  }

  console.log('\nMigration complete.')
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
