# PRD: Independent Professor Reviews

## Problem Statement

Cohub's rating system is entirely course-scoped: a `catalogRating` doc is keyed `uid_courseCode`, and the only professor-related signal it carries is `profGood`, buried inside a course rating. This misses a real category of relationship at an art school like Bezalel — students who worked with a professor as a project or thesis mentor, took a studio or workshop that was never entered into the app's catalog, or interacted with a guest instructor — none of which have a `courseCode` to attach a rating to. Today those students have no way to leave feedback on that professor at all, and the professor has no unified presence in the app to begin with (`lecturer` is a bare string on `course` docs, not an entity). The cost of not solving this: real signal about how professors mentor and teach outside the classroom is invisible, and professors who are mostly known through mentorship rather than cataloged courses are effectively unrated no matter how much interaction students have had with them.

## Goals

- Let a student submit a review of a professor they've interacted with, even when no cataloged course connects them.
- Give every professor a durable identity in the data model, independent of any single course.
- Surface one unified quality signal per professor that blends course-derived and independent review data, without requiring a v1 weighting scheme.
- Keep the schema extensible: new relationship types or a second rating axis should be addable later without a data migration.

## Non-Goals

- **Weighting/bias correction between course and independent review scores** — pooling is unweighted for v1. A few loud independent reviews may swing a low-N professor's score more than a broad course sample would. Accepted risk for launch; revisit only if it proves to be a real problem in practice.
- **A second rating axis** (e.g. approachability, responsiveness) — one star field only for v1. Adding more axes is a fast-follow once we see whether "quality of teaching/guidance" alone is expressive enough.
- **Report/hide/moderation tooling** — no abuse-handling mechanism ships in v1. The required `relationshipType` field is the only trust anchor; "other" (free text) is a known soft spot in that gate, deliberately accepted for now.
- **Ongoing professor identity dedup/merge UI** — the one-time migration script handles a best-effort dedup pass on existing `lecturer` strings at seed time (see Requirements), but no standing tool for merging duplicate professor records ships in v1; any post-launch duplicates are a manual/future cleanup problem.
- **Verification of claimed relationships** — like existing course ratings, a professor review's `relationshipType` is self-reported and not checked against any roster or enrollment data.

## User Stories

- As a student who was mentored on a project or thesis by a professor, I want to leave a review of that mentorship so my experience is captured even though no course covers it.
- As a student who took a studio/workshop that isn't in Cohub's catalog, I want to review the professor who taught it.
- As a student browsing a professor's page, I want to see one overall quality score that reflects both their cataloged courses and any independent reviews, so I get a single read on the professor without cross-referencing multiple numbers.
- As a student on a professor's page, I want to see the list of their cataloged courses (as today) and, separately, the list of independent reviews with their relationship type, so I understand where the signal is coming from.
- As a student submitting an independent review, I want to specify how I know the professor (taught an off-catalog course / project mentorship / other) so my review carries context even without a course to anchor it.

## Requirements

### Must-Have (P0)

**Data model**
- Add a `professors` Firestore collection. Each doc represents one professor as a first-class entity (id, name, and any fields already implicitly associated with a lecturer today).
  - *Acceptance criteria:* A `professors` doc can be created and read independent of any `course` doc; `LecturerDetail.jsx`'s route (`/lecturer/:lecturerName` or equivalent) resolves to a professor identity rather than a raw string match.
- Add a `professorReviews` collection, separate from `catalogRatings`, containing: `professorId`, `uid`, `relationshipType`, `relationshipDetail` (free text, populated when `relationshipType === 'other'`), `quality` (1–5 stars, same scale/meaning as `profGood`), `comment` (optional), `createdAt`.
  - *Acceptance criteria:* A review can be written and read without referencing a `courseCode`; one review per `uid`+`professorId` (mirroring the `uid_courseCode` uniqueness pattern on `catalogRatings`) to prevent duplicate submissions.
- `relationshipType` is validated against a maintained list (e.g. a constants file or Firestore-backed config), not hardcoded as a UI-only enum, so new types can be added without touching form logic everywhere it's used.
  - *Acceptance criteria:* Adding a new relationship type requires editing one list, not multiple components.

**Review submission**
- New review form (new screen or modal, e.g. `ProfessorRate.jsx`) with:
  - Relationship type selector: "לימד/ה קורס שלא מופיע באפליקציה" (taught a course not shown in the app) / "הנחיית פרויקט" (project mentorship) / "אחר" (other, with a required free-text field when selected).
  - One star field, 1–5, labeled to match `profGood`'s intent but generalized (e.g. "איכות ההדרכה/ההוראה" — quality of teaching/guidance).
  - Optional comment field, reusing the existing `Textarea` component pattern from `SwipeCard.jsx`.
  - Submit disabled until relationship type (and, if "other," the detail text) and the star rating are set.
  - *Acceptance criteria:* Submitting writes a `professorReviews` doc; a second submission by the same `uid` for the same `professorId` updates rather than duplicates (same upsert pattern as `submitRating`).

**Professor page**
- Evolve `LecturerDetail.jsx` to show, top to bottom:
  1. Professor name and one unified score: unweighted average pooling `profGood` values from the professor's course ratings (via existing `groupRatingsByCourseCode`/`computeAggregate` machinery) with `quality` values from their `professorReviews`.
  2. The existing list of cataloged courses with per-course aggregates (unchanged from today).
  3. A new list of independent reviews, each showing relationship type, star rating, and comment (no reviewer identity beyond what course ratings already expose).
  - *Acceptance criteria:* A professor with zero independent reviews renders identically to today's course-only view (score = pooled course `profGood` only). A professor with zero cataloged courses but at least one independent review still renders a page with a score and the reviews list.

**Professor directory**
- New screen listing/searching all `professors` docs, reachable independent of any course. This is the entry point for reviewing a professor with no cataloged course to launch from, and doubles as the general "find a professor" surface.
  - *Acceptance criteria:* A student can search or browse to any professor and reach that professor's page and review form without first navigating through a course.

**Professor creation is explicit, backfilled by migration**
- `professors` doc shape: `{ name, titles: string[] }`. `titles` holds zero or more stripped prefixes (e.g. `["ד"ר", "אדר'"]`); `name` is the remainder. A maintained prefix list (not hardcoded inline) drives the strip — confirmed prefixes in the current data: `ד"ר`, `פרופ'`, `אדר'`, and they can stack (e.g. `ד"ר אדר' ליאת סאבין בן שושן`).
- `course.lecturer` (single string) is migrated to `course.professorIds: string[]`, not a single reference — the seed data contains `lecturer` values with multiple comma-separated people (e.g. `'ד"ר אלעד פרסוב, פרופ\' יפעת בן דוד'`, `'ד"ר חוסני אלחטיב שחאדה, ד"ר אריאל הנדל'`), so a course can have more than one professor.
- Migration algorithm: for each `course.lecturer` string, split on comma into individual people first, then strip prefix tokens from the front of each piece into `titles`, leaving `name`. Match the resulting `name` against a known-overrides map (see below) before creating/deduping a `professors` doc.
- **Known spelling-variant overrides** (found in the current seed data, confirmed canonical form; seed the migration script's override map with these and expect to find more during manual review):
  - `חוסני אלחטיב שחאדה` → `חוסני אלח'טיב שחאדה` (appears without the geresh in 3 of 4 occurrences — majority vote would pick wrong)
  - `אייל שגיא ביזאווי` / `איל שגיא ביזאווי` → `איל שגיא ביזאוי` (3 spelling variants across 4 occurrences; the canonical form is not the majority spelling either)
- **General tie-break heuristic** for any other near-duplicate name pair found during the manual review pass without a known correction: prefer the spelling with more characters. This is a manual-review aid, not a rule for blind automated fuzzy-merging — auto-merging similar-looking names risks conflating two different people. When the migration script's review pass turns up a near-duplicate pair it can't confidently resolve with this heuristic, flag it for the PM to confirm rather than guessing.
  - *Acceptance criteria:* After migration, every existing `course.lecturer` value's constituent people resolve to `professors` docs (deduped per the overrides map and manual review); `LecturerDetail.jsx`'s course lookups continue to work unchanged (same aggregate results as pre-migration) via the new `professorIds` link.
  - Any professor added after launch (one not already implied by an existing course) is created explicitly as part of submitting the first review or course reference to them — exact creation trigger (review flow vs. directory "add professor") to be decided in implementation, but never silently inferred from a typed name without a lookup/create step.

**Security rules**
- `professorReviews` uses the same Firestore security rules shape as `catalogRatings` (owner-write via `uid` match, public read) — no new rule design needed for v1.

### Nice-to-Have (P1)

- Show independent-review count and course-rating count separately near the unified score (e.g. "מבוסס על 3 קורסים, 2 חוויות נוספות") so the score's provenance is legible even without splitting it into two numbers.
- Autocomplete/typeahead against existing `professors` docs when starting a review, to reduce accidental duplicate professor entities from name variants.
- Attendance-policy rollup on the professor page: aggregate the existing `attendanceTaken` field across a professor's cataloged course ratings and show it as a single indicator (e.g. "נוכחות נבדקת ברוב הקורסים"). Pure display aggregation over existing course-rating data — no new input field on the professor review form, since `attendanceTaken` doesn't map to mentorship or most "other" relationship types.

### Future Considerations (P2)

- Weighting scheme if unweighted pooling proves to distort scores for low-N professors.
- Second rating axis (approachability, responsiveness, availability) — schema already supports adding a field to `professorReviews` without migration.
- Report/hide mechanism for abusive reviews, particularly through the "other" relationship type.
- Professor dedup/merge tooling for name-variant cleanup in the `professors` collection.

## Success Metrics

**Leading indicators**
- Number of `professorReviews` submitted in the first 30 days post-launch.
- % of submitted reviews using "other" as the relationship type (signal for whether the two named categories cover real usage, or whether more types are needed).
- Submission completion rate on the new review form (started vs. completed).

**Lagging indicators**
- Number of professors who have at least one independent review but zero cataloged courses (direct measure of the gap this feature was built to close).
- Any reports/complaints about a specific professor review (informal signal for whether moderation tooling needs to be pulled forward from P2).

## Open Questions

- **(Engineering)** Exact migration script design: how to deduplicate `lecturer` strings that are likely the same person but spelled differently (e.g. with/without a "ד"ר" prefix) before creating one `professors` doc per real person — a naive distinct-string pass will over-create professor docs. Needs a pass/review step before running against production data.
- **(Design)** Professor directory layout — list, search, alphabetical/department grouping — not designed yet, just scoped as required.

## Timeline Considerations

No hard external deadline identified. Natural phasing:
1. Data model (`professors`, `professorReviews`, security rules matching `catalogRatings`) + migration script backfilling `professors` from existing `course.lecturer` strings, including the dedup pass.
2. Review submission flow.
3. Professor page update (unified score + reviews list).
4. Professor directory (can ship slightly after the above if a temporary link from an existing professor page unblocks early usage of the review flow).
