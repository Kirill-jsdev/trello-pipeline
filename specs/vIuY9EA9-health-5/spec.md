# Health-5 endpoint

- Trello: https://trello.com/c/vIuY9EA9/10-create-health-5-endpoint
- Status: Implemented

## Goal
Provide a `/health-5` endpoint that lets clients check whether the service is available.

## User Story
As an API user, I want a /health-5 endpoint, so that I can check the service's availability.

## Acceptance Criteria
- AC-1: `GET /health-5` responds with HTTP status 200.
- AC-2: The response body of `GET /health-5` is JSON exactly equal to `{"status": "ok"}`.
- AC-3: `GET /health-5` is covered by an automated Supertest test in `tests/app.test.ts` that is run against the exported `app` and asserts the status and body.
- AC-4: All existing tests continue to pass.

## Affected files
- `src/app.ts` — add the `GET /health-5` route returning `200 { "status": "ok" }`.
- `tests/app.test.ts` — add tests for `GET /health-5`.
- `CLAUDE.md` — add `GET /health-5` to the endpoints list.

## Test plan
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: GET /health-5 returns status 200` | `tests/app.test.ts` |
| AC-2 | `AC-2: GET /health-5 returns body {"status":"ok"}` | `tests/app.test.ts` |
| AC-3 | `AC-3: GET /health-5 is exercised via Supertest against the app` | `tests/app.test.ts` |
| AC-4 | `npm test` | all existing tests |

## Out of scope
- Dependency checks (database, external services) in the health response.
- Additional response fields (uptime, version, timestamp).
- Support for HTTP methods other than GET on `/health-5`.
- Changes to existing endpoints `/sum` and `/hello`.
