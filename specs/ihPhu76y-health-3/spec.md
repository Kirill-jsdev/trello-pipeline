# Health-3 endpoint

- Trello: https://trello.com/c/ihPhu76y/8-create-health-3-endpoint
- Status: Implemented

## Goal
Provide a lightweight `/health-3` endpoint so that the availability of the service can be checked.

## User Story
As an API user, I want a `/health-3` endpoint, so that I can check the service's availability.

## Acceptance Criteria
- AC-1: `GET /health-3` responds with HTTP status 200.
- AC-2: The response body of `GET /health-3` is JSON equal to `{"status": "ok"}`.
- AC-3: The `/health-3` endpoint is covered by an automated test in `tests/app.test.ts` (Supertest, `node:test`).
- AC-4: All existing tests continue to pass.

## Affected files
- `src/app.ts` — add the `GET /health-3` route returning `200 { "status": "ok" }`.
- `tests/app.test.ts` — add a `describe('GET /health-3')` block with tests for AC-1 and AC-2.
- `CLAUDE.md` — add `GET /health-3` to the endpoints list.

## Test plan
| AC | Test | File |
|---|---|---|
| AC-1 | `AC-1: GET /health-3 returns 200` | `tests/app.test.ts` |
| AC-2 | `AC-2: GET /health-3 returns {"status":"ok"}` | `tests/app.test.ts` |
| AC-3 | `AC-3: /health-3 tests exist and run under npm test` (check: the tests for AC-1 and AC-2 are present in `tests/app.test.ts` and executed by `npm test`) | `tests/app.test.ts` |
| AC-4 | `npm test` (all pre-existing `/sum` and `/hello` tests pass) | `tests/app.test.ts` |

## Out of scope
- Dependency checks (database, external services) in the health response.
- Additional response fields (uptime, version, timestamp).
- Changes to the existing `/sum` and `/hello` endpoints.
- Any other health endpoint such as `/health` or `/health-2`.
