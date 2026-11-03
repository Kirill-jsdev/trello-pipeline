# Health-4 endpoint

- Trello: https://trello.com/c/0A2eAtsV/9-create-health-4-endpoint
- Status: Implemented

## Goal
Provide a `/health-4` endpoint so that the availability of the service can be checked with a simple HTTP request.

## User Story
As an API user, I want a `/health-4` endpoint, so that I can check the service's availability.

## Acceptance Criteria
- AC-1: `GET /health-4` returns HTTP status 200.
- AC-2: The response body of `GET /health-4` is JSON `{"status": "ok"}`.
- AC-3: The `/health-4` endpoint is covered by an automated test in `tests/`.
- AC-4: Existing tests continue to pass.

## Affected files
- `src/app.ts` — add the `GET /health-4` route returning `{ status: 'ok' }`.
- `tests/app.test.ts` — add tests for `GET /health-4`.
- `CLAUDE.md` — add `GET /health-4` to the endpoints list.

## Test plan
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: GET /health-4 returns 200` | `tests/app.test.ts` |
| AC-2 | `AC-2: GET /health-4 returns {"status":"ok"}` | `tests/app.test.ts` |
| AC-3 | `AC-3: /health-4 is covered by an automated test` (satisfied by the AC-1 and AC-2 tests existing in `tests/app.test.ts`; verified by `npm test`) | `tests/app.test.ts` |
| AC-4 | `npm test` (all pre-existing tests for `/sum` and `/hello` still pass) | `tests/app.test.ts` |

## Out of scope
- Dependency checks (database, external services) in the health check.
- Changes to the existing `/sum` and `/hello` endpoints.
- Other HTTP methods on `/health-4`.
- Additional response fields (uptime, version, timestamp).
