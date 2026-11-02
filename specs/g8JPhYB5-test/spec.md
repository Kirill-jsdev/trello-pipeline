# /test endpoint

- Trello: https://trello.com/c/g8JPhYB5/3-create-test-endpoint
- Status: Implemented

## Goal
Provide a simple endpoint that lets API users check that the service is available.

## User Story
As an API user, I want a /test endpoint, so that I can check the service's availability.

Note: the card's story text mentions "/health", but the card title and the acceptance criteria consistently specify `/test`; this spec follows `/test`.

## Acceptance Criteria
- AC-1: `GET /test` returns HTTP status 200.
- AC-2: The `GET /test` response body is JSON `{"status": "ok"}`.
- AC-3: The endpoint is covered by an automated test in `tests/`.
- AC-4: Existing tests continue to pass.

## Affected files
- `src/app.ts` — add the `GET /test` route returning `{ status: 'ok' }`.
- `tests/app.test.ts` — add a `GET /test` test suite.

## Test plan
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: GET /test returns 200` | `tests/app.test.ts` |
| AC-2 | `AC-2: GET /test returns { status: "ok" }` | `tests/app.test.ts` |
| AC-3 | `AC-3: GET /test is covered by an automated test` (satisfied by the AC-1 and AC-2 tests; verified by `npm test`) | `tests/app.test.ts` |
| AC-4 | `npm test` (all pre-existing `/sum` and `/hello` tests pass) | `tests/app.test.ts` |

## Out of scope
- Any `/health` route.
- Dependency checks (database, external services) or other readiness/liveness logic.
- Support for methods other than GET, and query parameters.
- Changes to the existing `/sum` and `/hello` endpoints.
