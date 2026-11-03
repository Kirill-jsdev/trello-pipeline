# Health-2 endpoint

- Trello: https://trello.com/c/jHLMdKjV/7-create-health-2-endpoint
- Status: Implemented

## Goal
Provide a `/health-2` endpoint so that API users can check the availability of the service.

## User Story
As an API user, I want a `/health-2` endpoint, so that I can check the service's availability.

## Acceptance Criteria
- AC-1: `GET /health-2` returns HTTP status 200.
- AC-2: The response body of `GET /health-2` is JSON `{"status": "ok"}`.
- AC-3: The `GET /health-2` endpoint is covered by an automated test in `tests/app.test.ts`.
- AC-4: Existing tests continue to pass.

## Affected files
- `src/app.ts` — add the `GET /health-2` route returning `{ status: 'ok' }`.
- `tests/app.test.ts` — add a `GET /health-2` describe block with Supertest tests.
- `CLAUDE.md` — add `GET /health-2` to the endpoints list.

## Test plan
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: returns 200` | `tests/app.test.ts` |
| AC-2 | `AC-2: returns {"status":"ok"} body` | `tests/app.test.ts` |
| AC-3 | `AC-3: health-2 endpoint is covered by tests` (satisfied by the AC-1 and AC-2 tests being present in the file) | `tests/app.test.ts` |
| AC-4 | `npm test` (all pre-existing tests pass) | `tests/app.test.ts` |

## Out of scope
- Dependency checks (database, external services) in the health check.
- Additional response fields (uptime, version, timestamp).
- Support for HTTP methods other than GET.
- Changes to any existing endpoint (`/sum`, `/hello`).
