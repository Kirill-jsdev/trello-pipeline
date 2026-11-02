<!--
  Spec template. A copy goes to specs/<card>-<slug>/spec.md,
  where <card> is the Trello card short link (e.g. 54c0NZmm) and <slug> is the feature name in kebab-case.
  The spec is the single source of requirements for implementer and verifier: anything not in it is not implemented.
  Do not copy the template's HTML comments into the finished spec.
-->
# <Feature name>

- Trello: <card URL>
- Status: Draft | Approved | Implemented

## Goal
<!-- 1–2 sentences: what problem the feature solves. -->
<1–2 sentences>

## User Story
As a <role>, I want <action>, so that <value>.

## Acceptance Criteria
<!--
  AC-1, AC-2, … numbering is sequential and does not change after the spec is committed.
  Every item is verifiable: observable behavior (method, path, status, response body) or a fact about the repository.
-->
- AC-1: <verifiable condition>
- AC-2: …

## Affected files
- `<path>` — <change>

## Test plan
<!--
  Every AC is covered by at least one test or check; the test name starts with the AC ID.
  For an AC without a dedicated test (e.g. "existing tests continue to pass"), name the check: `npm test`.
-->
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: <test name>` | `tests/<file>.test.ts` |

## Out of scope
- <what is not done>
