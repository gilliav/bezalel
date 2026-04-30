# Hebrew Relative Date Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `formatRelativeDateHe(firestoreTimestamp)` to `src/utils/dates.js` that returns natural Hebrew relative date strings.

**Architecture:** A single exported function that computes day offset from today (midnight-based) and maps it to natural Hebrew using named forms for ±1–2 days, dual forms for 7/14 days, numeric for 3–83 days, and absolute date fallback beyond 12 weeks.

**Tech Stack:** Vanilla JS, Firestore Timestamp (`.toDate()`), Vitest (existing test setup)

---

### Task 1: Write failing tests for `formatRelativeDateHe`

**Files:**
- Modify: `src/utils/dates.test.js`

- [ ] **Step 1: Add import and helper to test file**

Open `src/utils/dates.test.js` and update the import line and add a helper at the top:

```js
import { Timestamp } from 'firebase/firestore'
import { isOverdue, formatDateHe, sortByDueDate, formatRelativeDateHe } from './dates'

// Helper: Firestore Timestamp N days from today (midnight-aligned)
function tsOffsetDays(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return Timestamp.fromDate(d)
}
```

- [ ] **Step 2: Add the test suite**

Append after the existing `sortByDueDate` describe block:

```js
describe('formatRelativeDateHe', () => {
  it('returns היום for today', () => {
    expect(formatRelativeDateHe(tsOffsetDays(0))).toBe('היום')
  })
  it('returns אתמול for -1 day', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-1))).toBe('אתמול')
  })
  it('returns מחר for +1 day', () => {
    expect(formatRelativeDateHe(tsOffsetDays(1))).toBe('מחר')
  })
  it('returns שלשום for -2 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-2))).toBe('שלשום')
  })
  it('returns מחרתיים for +2 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(2))).toBe('מחרתיים')
  })
  it('returns לפני N ימים for -5 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-5))).toBe('לפני 5 ימים')
  })
  it('returns בעוד N ימים for +5 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(5))).toBe('בעוד 5 ימים')
  })
  it('returns לפני N ימים for -10 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-10))).toBe('לפני 10 ימים')
  })
  it('returns בעוד N ימים for +10 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(10))).toBe('בעוד 10 ימים')
  })
  it('returns לפני שבוע for -7 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-7))).toBe('לפני שבוע')
  })
  it('returns בעוד שבוע for +7 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(7))).toBe('בעוד שבוע')
  })
  it('returns לפני שבועיים for -14 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-14))).toBe('לפני שבועיים')
  })
  it('returns בעוד שבועיים for +14 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(14))).toBe('בעוד שבועיים')
  })
  it('returns לפני N שבועות for -21 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(-21))).toBe('לפני 3 שבועות')
  })
  it('returns בעוד N שבועות for +28 days', () => {
    expect(formatRelativeDateHe(tsOffsetDays(28))).toBe('בעוד 4 שבועות')
  })
  it('falls back to absolute date for +90 days', () => {
    const ts = tsOffsetDays(90)
    const result = formatRelativeDateHe(ts)
    // Should be same as formatDateHe — non-empty Hebrew string, not a relative form
    expect(result).toBe(formatDateHe(ts))
  })
  it('falls back to absolute date for -90 days', () => {
    const ts = tsOffsetDays(-90)
    const result = formatRelativeDateHe(ts)
    expect(result).toBe(formatDateHe(ts))
  })
})
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
npm test -- --reporter=verbose src/utils/dates.test.js
```

Expected: all `formatRelativeDateHe` tests FAIL with `formatRelativeDateHe is not a function` (or similar). Existing tests still pass.

- [ ] **Step 4: Commit failing tests**

```bash
git add src/utils/dates.test.js
git commit -m "test: add failing tests for formatRelativeDateHe"
```

---

### Task 2: Implement `formatRelativeDateHe`

**Files:**
- Modify: `src/utils/dates.js`

- [ ] **Step 1: Add the function to `src/utils/dates.js`**

Append at the end of the file:

```js
export function formatRelativeDateHe(firestoreTimestamp) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = firestoreTimestamp.toDate()
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target - today) / 86_400_000)

  if (diff === -2) return 'שלשום'
  if (diff === -1) return 'אתמול'
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff === 2) return 'מחרתיים'
  if (diff === -7) return 'לפני שבוע'
  if (diff === 7) return 'בעוד שבוע'
  if (diff === -14) return 'לפני שבועיים'
  if (diff === 14) return 'בעוד שבועיים'

  const absDiff = Math.abs(diff)

  if (absDiff <= 13) {
    return diff < 0 ? `לפני ${absDiff} ימים` : `בעוד ${absDiff} ימים`
  }

  if (absDiff <= 83) {
    const weeks = Math.round(absDiff / 7)
    return diff < 0 ? `לפני ${weeks} שבועות` : `בעוד ${weeks} שבועות`
  }

  return formatDateHe(firestoreTimestamp)
}
```

- [ ] **Step 2: Run tests to confirm they pass**

```bash
npm test -- --reporter=verbose src/utils/dates.test.js
```

Expected: all tests PASS.

- [ ] **Step 3: Commit implementation**

```bash
git add src/utils/dates.js
git commit -m "feat: add formatRelativeDateHe utility"
```
