# AI pipeline: from a Trello card to a GitHub commit

This Claude Code pipeline automates part of the SDLC. It takes a Trello card with a User Story and Acceptance Criteria,
writes a specification from it, implements code with tests, verifies the result and publishes a separate branch
on GitHub with two commits: the spec first, then the code. Finally, it reports back on the card.

The pipeline follows Spec-Driven Development: the specification is a versioned repository artifact and the single
source of requirements for both implementation and verification.

## Contents

- [How it works](#how-it-works)
- [Components](#components)
- [Specification](#specification)
- [Trello board](#trello-board)
- [Security and permissions](#security-and-permissions)
- [Setup](#setup)
- [Running](#running)
- [Result](#result)
- [Troubleshooting](#troubleshooting)
- [Changing the pipeline](#changing-the-pipeline)
- [Limitations](#limitations)

## How it works

```
Trello: card in To Do
        │
        ▼
 1. Intake ─────── trello-intake ── preflight: clean main, npm ci, green tests
        │                           trello-analyst: card → specs/<card>-<slug>/spec.md
        │                           spec validated against the template → Status: Approved
        │                           card → In progress
        ▼
 2. Spec ───────── ship-branch spec ── branch feature/<card>-<slug> from main
        │                              commit docs(spec): add spec for <feature>
        ▼
 3. Implement ──── implement-spec ── implementer: code and tests from the spec
        │                            verifier: build, tests, smoke, PASS/FAIL per AC
        │                            FAIL → implementer gets the report and fixes it (up to 2 retries)
        ▼
 4. Ship ───────── ship-branch code ── spec → Status: Implemented
        │                              commit feat(...) with Spec: and Trello-Card: trailers
        │                              git push, commits confirmed on GitHub via gh api
        ▼
 5. Report ─────── trello-report ── card comment: branch, spec, commits, AC table
                                    card → Review

GitHub Actions: build and tests on every push to feature/** — a check independent of the agent.
```

The `/trello-to-commit` orchestrator runs the stages. It reads each stage's result and stops at the first failure.
The reason for stopping is always visible on the card or in the final result block.

## Components

| Component | File | Role |
|---|---|---|
| Trello MCP | `.mcp.json` | Atlassian's official MCP server `https://mcp.trello.com/v1`: read cards, comment, move between lists |
| GitHub | `git`, `gh` | Push the branch and confirm commits on GitHub (read-only `gh api` GET requests) |
| Config | `.claude/pipeline.json` | Board and list IDs, repository, base branch, branch prefix, paths, retry count |
| Spec template | `specs/_template.md` | Specification format |
| **Subagents** | `.claude/agents/` | Separate contexts with minimal permissions |
| `trello-analyst` | | Card → spec. Reads Trello and code, writes only the spec |
| `implementer` | | Implements strictly by the spec. Files and `npm test`; no git or Trello |
| `verifier` | | Checks against the spec. Cannot edit files; returns a verdict with evidence |
| **Skills** | `.claude/skills/` | Process stages; each can be run on its own |
| `trello-intake` | | Preflight, spec, validation, card → In progress |
| `ship-branch` | | `spec` mode: branch and spec commit. `code` mode: code commit, push, GitHub check |
| `implement-spec` | | implementer → verifier loop with retries |
| `trello-report` | | Report on the card, card → Review |
| `trello-to-commit` | | Orchestrator for all stages |
| **Guardrails** | `.claude/settings.json`, `.claude/hooks/` | Allow/deny lists and two hooks |
| `guard-git.mjs` | | Blocks destructive git operations and writes via `gh api` |
| `typecheck.mjs` | | `tsc --noEmit` after every `.ts` edit |
| Headless runner | `scripts/run-pipeline.mjs` | `npm run pipeline -- <card>` without an interactive session |
| CI | `.github/workflows/ci.yml` | `npm ci`, `npm run build`, `npm test` on GitHub |

### Separation of roles

Roles are split the way they are in a team — analyst, developer, QA — and each has its own permissions:

| | Trello | Code | Git | Decides |
|---|---|---|---|---|
| `trello-analyst` | read | read, write the spec | — | what to build |
| `implementer` | — | read and write | — | how to build it |
| `verifier` | — | read only | read only | whether it is done |
| Skills (main session) | read, comment, move | spec status | commit, push to `feature/*` | stage order |

`verifier` cannot fix the code to make it pass; `implementer` cannot commit unverified code.

## Specification

The spec lives in `specs/<card>-<slug>/spec.md` and is committed to the branch in its own commit, **before** the code.
`<card>` is the card's short link (e.g. `54c0NZmm`), `<slug>` is 1–2 words about the feature (e.g. `health`).

Spec sections:

| Section | Content |
|---|---|
| Header | Feature name, card link, status |
| Goal | What problem the feature solves |
| User Story | As a <role>, I want <action>, so that <value> |
| Acceptance Criteria | `AC-1`, `AC-2`, … — each item is verifiable: method, path, status, response body |
| Affected files | Which files change and how |
| Test plan | Which test covers which AC; the test name starts with the AC ID |
| Out of scope | What the feature does not do |

Status lifecycle: `Draft` (written by the analyst) → `Approved` (passed validation) → `Implemented` (code committed).

Rules that follow from the spec:

- `implementer` touches only the files in "Affected files", and only the lines it needs, whitespace included.
- Tests are named after ACs: `it('AC-1: GET /health returns 200', …)`.
- `verifier` gives a PASS only with concrete evidence: a passing test, a real HTTP response or a line of code.
  Any change outside the spec is a FAIL.

## Trello board

```
To Do → In progress → Review → Done
             ↘ Blocked
```

| List | Moved by | Meaning |
|---|---|---|
| To Do | human | Card is ready for the agent |
| In progress | pipeline | Spec is ready, implementation in progress |
| Blocked | pipeline | Clarification needed or verification failed; reason in a comment |
| Review | pipeline | Branch is on GitHub, waiting for review |
| Done | human | Branch merged into `main` |

List IDs are stored in `.claude/pipeline.json`, so lists can be renamed freely.
If a list is deleted and recreated, update its ID.

### Writing a card

- **Name** — a short feature name.
- **Description** — the User Story.
- **Acceptance Criteria** — a checklist with that name, or a list in the description. One item = one verifiable condition.

```
As an API user, I want a /health endpoint so that I can check the service's availability.

Acceptance Criteria:
- GET /health returns HTTP 200;
- the response has the format {"status": "ok"};
- the endpoint is covered by an automated test;
- existing tests continue to pass.
```

Subjective wording ("fast", "convenient", "correct") sends the card to Blocked with questions.

## Security and permissions

**Secrets.** There are none in the repository. Trello authenticates via OAuth and Claude Code stores the token.
GitHub uses your existing `gh` authentication.

**Permissions** (`.claude/settings.json`):

- Allowed without a prompt: `npm ci`, `npm test`, `npm run build`, the `npx tsx -e` smoke request,
  read-only git, `feature/*` branches, `git add` and `git commit`, `git push -u origin feature/*`,
  read-only `gh api` on commits, branches and comparisons, Trello reads, and among Trello writes only comments and card moves.
- Denied: force-push, push to `main`, `git reset --hard`, changing board structure, Inbox and Planner, reading `.env`.

**The `guard-git` hook** checks every command before it runs, even if the model departs from its instructions. It blocks:

- commits to `main`;
- pushes to `main` in any form: `origin main`, `HEAD`, `x:main`, no arguments while on `main`;
- force-pushes: `--force`, `-f`, `-uf`, `--force-with-lease`, `+refspec`;
- `git push --all`, `--mirror`, `--delete`;
- `git reset --hard`;
- `gh api` with any method other than GET, or with a request body.

It parses the whole command, including chains like `npm test && git push origin main`.

**As a consequence**, only a human can merge a branch into `main` or delete a branch on GitHub.

## Setup

Once per machine:

1. Install Node.js 24+, [Claude Code](https://claude.com/claude-code) and [GitHub CLI](https://cli.github.com/).
2. `gh auth login` with an account that can push to the repository.
3. Clone the repository and run `npm ci`.
4. Run `claude` in the repository root. The project MCP server `trello` is enabled automatically.
5. Run `/mcp` → `trello` → **Authenticate** and grant access to Trello in the browser.
6. Check: `/mcp` shows `trello ✔ connected`.

For a different board, update `trello` in `.claude/pipeline.json`: the board URL and list IDs.
To get the IDs, ask in a Claude session: "show the lists of board <URL> with their IDs".

## Running

Before running: you are on `main`, the working tree is clean, and `main` matches `origin/main`.

### Interactive

```
claude
> /trello-to-commit https://trello.com/c/<shortLink>
```

You see the progress in the session. Good for demos and debugging.

### Headless

```
npm run pipeline -- https://trello.com/c/<shortLink>
npm run pipeline -- <shortLink>
```

The console shows skill, agent and tool calls. The full log goes to `.pipeline/<shortLink>/run.log`.

| Exit code | Meaning |
|---|---|
| `0` | `PIPELINE: OK` — branch on GitHub, card in Review |
| `1` | `PIPELINE: STOPPED` — the pipeline stopped; reason in the output and on the card |
| `2` | Launch error, or the final result block was not found |

The command can run from cron, CI or a Trello webhook.

### Individual stages

Each stage is a separate skill, which you can run by hand to debug or repeat it:

| Command | Stage |
|---|---|
| `/trello-intake <card>` | Spec from the card |
| `/ship-branch spec <card>` | Branch and spec commit |
| `/implement-spec <card>` | Implementation and verification |
| `/ship-branch code <card>` | Code commit, push, GitHub check |
| `/trello-report <card>` | Report on the card |

## Result

**Branch `feature/<card>-<slug>` on GitHub:**

```
* feat(api): add GET /health endpoint
* docs(spec): add spec for health endpoint
* <latest main commit>
```

**Code commit:**

```
feat(api): add GET /health endpoint

Add a health-check route that returns 200 {"status": "ok"} so API users
can check service availability; list it in CLAUDE.md.

Acceptance Criteria:
- AC-1: GET /health returns 200 — test "AC-1: GET /health returns 200"
- AC-2: body is {"status": "ok"} — test "AC-2: GET /health returns {"status":"ok"}"
- AC-3: endpoint covered by an automated test — AC-1/AC-2 tests in tests/app.test.ts
- AC-4: existing tests still pass — npm test (6/6)

Spec: specs/54c0NZmm-health/spec.md
Trello-Card: https://trello.com/c/54c0NZmm/1-create-health-endpoint
```

**Trello comment:** links to the branch, the spec and both commits, the AC table with evidence and the check results.
The card moves to Review.

**Working files** go to `.pipeline/<card>/` and are not tracked by git:

| File | Content |
|---|---|
| `verify-<n>.md`, `verify.md` | `verifier` reports per attempt and the final one |
| `ship.md` | Branch, commits, links |
| `report.md` | Text of the Trello comment |
| `run.md` | Results of all stages |
| `run.log` | Full headless-run log |

### Review

1. Open the spec from the card link and check that the requirements were understood correctly.
2. Check the code: `git fetch && git switch feature/<card>-<slug> && npm test`.
3. Make sure CI on the branch is green.
4. Merge the branch into `main` and move the card to Done.

If the requirements were misunderstood, fix the card, delete the branch and spec, and rerun the pipeline.
If only the code is off, finish the branch by hand.

## Troubleshooting

| Symptom | Cause | What to do |
|---|---|---|
| `PIPELINE: STOPPED` at Intake, preflight | Dirty working tree, not on `main`, `main` behind, or failing tests | Fix `main` and rerun |
| Card not in To Do | The pipeline only takes cards from To Do | Move the card and rerun |
| Blocked: "clarification needed" | ACs are unverifiable or contradictory | Answer the questions on the card, move it back to To Do |
| Blocked: "implementation blocked" | Verification failed after all retries | AC table in the comment, reports in `.pipeline/<card>/`, changes left on the branch |
| `INTAKE: EXISTS` | A spec for the card already exists | The work is done; to redo it, delete the spec and branch |
| Blocked: "stopped at Spec/Ship/Report" | git, push or Trello error | Reason in the comment; the pipeline leaves the branch and commits as they are |
| Trello unavailable | Authorization expired | `/mcp` → `trello` → Authenticate |

After stopping, the pipeline rolls nothing back; the state is left for inspection.

## Changing the pipeline

- **Agents and skills** live in `.claude/agents/` and `.claude/skills/`, written in English.
  Restart the Claude Code session after editing them: definitions load at startup.
- **Spec template** — `specs/_template.md`. If you change its sections, update the validation in `trello-intake`.
- **Retry count** — `maxRetries` in `.claude/pipeline.json`.
- **A new command for agents** — add it to `permissions.allow` in `.claude/settings.json`.
  Otherwise it is rejected in headless mode.
- **Protected branch** — `git.baseBranch` in `.claude/pipeline.json`; `guard-git` reads it from there.

## Limitations

- One card per run; no parallel runs in the same working tree.
- No pull request is created: the result is a branch with commits.
- Only a human can merge a branch or delete it on GitHub: the agent is not allowed to.
- The smoke check starts the app from `src/app.ts`. Projects with a different layout need to adapt it in `verifier`.
- `implementer` sometimes touches neighboring lines. `verifier` catches it, and the fix lands on the second attempt.
