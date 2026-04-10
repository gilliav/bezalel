import { describe, it, expect } from 'vitest'
import { progressDocId, nextStatus } from '../hooks/useProgress'

describe('progressDocId', () => {
  it('combines uid and itemId with underscore', () => {
    expect(progressDocId('user123', 'item456')).toBe('user123_item456')
  })

  it('handles IDs that contain underscores', () => {
    expect(progressDocId('user_a', 'item_1')).toBe('user_a_item_1')
  })
})

describe('nextStatus', () => {
  it('goes from not_started to in_progress', () => {
    expect(nextStatus('not_started')).toBe('in_progress')
  })

  it('goes from in_progress to done', () => {
    expect(nextStatus('in_progress')).toBe('done')
  })

  it('goes from done back to not_started', () => {
    expect(nextStatus('done')).toBe('not_started')
  })
})
