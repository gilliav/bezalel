import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('../firebase', () => ({ db: {}, storage: {} }))
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn(),
    snapshot: { ref: {} },
  })),
  getDownloadURL: vi.fn(),
}))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))

import { FileUpload } from './FileUpload'

it('renders a file input that accepts pdf, png, jpg', () => {
  render(<FileUpload projectId="p1" onError={vi.fn()} />)
  const input = screen.getByLabelText(/העלאת קובץ/)
  expect(input).toHaveAttribute('accept', '.pdf,.png,.jpg,.jpeg')
})

it('shows uploading state while upload is in progress', async () => {
  const { uploadBytesResumable } = await import('firebase/storage')
  uploadBytesResumable.mockReturnValue({
    on: (event, progress, error, complete) => {
      progress({ bytesTransferred: 50, totalBytes: 100 })
    },
    snapshot: { ref: {} },
  })

  const user = userEvent.setup()
  render(<FileUpload projectId="p1" onError={vi.fn()} />)
  const input = screen.getByLabelText(/העלאת קובץ/)
  const file = new File(['content'], 'brief.pdf', { type: 'application/pdf' })
  await user.upload(input, file)
  expect(screen.getByText(/מעלה/)).toBeInTheDocument()
})
