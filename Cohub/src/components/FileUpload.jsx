import { useState, useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '../firebase'

export function FileUpload({ projectId, onError }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      onError?.('סוג קובץ לא נתמך. ניתן להעלות PDF, PNG, JPG בלבד.')
      return
    }

    const storageRef = ref(storage, `attachments/${projectId}/${Date.now()}_${file.name}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setUploading(true)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
      },
      () => {
        setUploading(false)
        onError?.('שגיאה בהעלאת הקובץ')
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          await addDoc(collection(db, 'projects', projectId, 'attachments'), {
            fileName: file.name,
            fileUrl: url,
            fileType: ext,
            uploadedAt: serverTimestamp(),
          })
        } catch {
          onError?.('שגיאה בשמירת הקובץ')
        } finally {
          setUploading(false)
          setProgress(0)
          if (inputRef.current) inputRef.current.value = ''
        }
      },
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-muted-foreground cursor-pointer">
        <span>העלאת קובץ (PDF / תמונה)</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
          aria-label="העלאת קובץ"
        />
      </label>
      {uploading && (
        <div className="text-sm text-primary">מעלה... {progress}%</div>
      )}
    </div>
  )
}
