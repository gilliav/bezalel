---
title: Hebrew Relative Date Function
date: 2026-04-05
status: approved
---

## Overview

Add `formatRelativeDateHe(firestoreTimestamp)` to `src/utils/dates.js`. Returns a natural Hebrew relative date string given a Firestore timestamp.

## Output Rules

Comparison is day-boundary based (midnight of today), not raw milliseconds. "Today" means same calendar day regardless of time.

| Day offset | Output |
|---|---|
| -2 | שלשום |
| -1 | אתמול |
| 0 | היום |
| +1 | מחר |
| +2 | מחרתיים |
| -(3–6) days | לפני N ימים |
| +(3–6) days | בעוד N ימים |
| -7 days | לפני שבוע |
| +7 days | בעוד שבוע |
| -(8–13) days | לפני N ימים |
| +(8–13) days | בעוד N ימים |
| -14 days | לפני שבועיים |
| +14 days | בעוד שבועיים |
| -(15–83) days (~3–11 weeks) | לפני N שבועות |
| +(15–83) days (~3–11 weeks) | בעוד N שבועות |
| beyond ~12 weeks | fallback to `formatDateHe()` (absolute Hebrew date) |

Note: day offset 14 (2 weeks) uses שבועיים, not "2 שבועות". Day offset 7 (1 week) uses שבוע, not "שבועות".

## Implementation Location

`src/utils/dates.js` — exported alongside existing helpers.

## Signature

```js
export function formatRelativeDateHe(firestoreTimestamp)
```

- Input: Firestore Timestamp (has `.toDate()`)
- Returns: string

## Day Offset Calculation

```
const today = new Date(); today.setHours(0,0,0,0)
const target = firestoreTimestamp.toDate(); target.setHours(0,0,0,0)
const diffDays = Math.round((target - today) / 86_400_000)
```

## Testing

Unit tests in `src/utils/dates.test.js` covering:
- Each named day (שלשום, אתמול, היום, מחר, מחרתיים)
- N days past/future (e.g. -5, +10)
- 1 week, 2 weeks (שבועיים), N weeks
- Fallback to absolute for large offsets
