# Health endpoint

- Trello: https://trello.com/c/q8hwh8n8/2-create-health-endpoint
- Status: Implemented

## Goal
Provide a lightweight endpoint that lets API users check whether the service is available.

## User Story
As an API user, I want a /health endpoint, so that I can check the service's availability.

## Acceptance Criteria
- AC-1: `GET /health` returns HTTP status 200.
- AC-2: The response body of `GET /health` is JSON `{"status": "ok"}`.
- AC-3: The `/health` endpoint is covered by an automated test in `tests/`.
- AC-4: All pre-existing tests continue to pass.

## Affected files
- `src/app.ts` — add the `GET /health` route returning `200 { "status": "ok" }`.
- `tests/app.test.ts` — add Supertest tests for `GET /health`.
- `CLAUDE.md` — list the new endpoint in the "Эндпоинты" section.

## Test plan
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: GET /health returns 200` | `tests/app.test.ts` |
| AC-2 | `AC-2: GET /health returns {"status":"ok"}` | `tests/app.test.ts` |
| AC-3 | `AC-3: /health endpoint has an automated test` | `tests/app.test.ts` |
| AC-4 | `npm test` | `tests/app.test.ts` |

## Out of scope
- Dependency checks (database, external services) in the health check.
- Extra response fields such as uptime, version or timestamp.
- Support for HTTP methods other than GET on `/health`.
