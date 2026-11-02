---
name: trello-to-commit
description: Full Trello pipeline orchestrator. Takes a Trello card from To Do to a pushed feature branch with a spec commit and a code commit, by running trello-intake, ship-branch spec, implement-spec, ship-branch code and trello-report in order and stopping on the first failure. Use when asked to process, implement or ship a Trello card end to end.
argument-hint: <card URL | short link>
---

# trello-to-commit

Run the whole pipeline for the Trello card `$ARGUMENTS`.

You are the orchestrator: run each stage skill below with the Skill tool, read the result block it ends with,
and decide whether to continue. Do not do a stage's work yourself and do not skip or reorder stages.

## Stages

| # | Stage | Run | Continue when |
|---|---|---|---|
| 1 | Intake | `/trello-intake <card>` | `INTAKE: READY` |
| 2 | Spec | `/ship-branch spec <card>` | `SHIP_SPEC: OK` |
| 3 | Implement | `/implement-spec <card>` | `IMPLEMENT: PASS` |
| 4 | Ship | `/ship-branch code <card>` | `SHIP_CODE: OK` |
| 5 | Report | `/trello-report <card>` | `REPORT: OK` |

Pass the same card argument to every stage. Keep each stage's result block for the summary.

## Stopping

On any other result, stop immediately and do not run later stages.

The card must always show why the pipeline stopped:
- `INTAKE: BLOCKED` and `IMPLEMENT: FAIL | BLOCKED` already comment on the card and move it to Blocked — do nothing more.
- `INTAKE: PREFLIGHT_FAILED` and `INTAKE: EXISTS` — the card was not touched; do not touch it either.
- `SHIP_SPEC: FAILED`, `SHIP_CODE: FAILED`, `REPORT: FAILED` — post a comment and move the card to the `blocked` list
  (`trello.lists.blocked.id` in `.claude/pipeline.json`):
  ```
  🤖 Pipeline: stopped at <stage>.

  <REASON from the stage result>

  Branch: <branch, if created>
  ```

Never clean up after a failure: do not delete branches, revert files or reset commits. A developer inspects the state.

## Output

Write `.pipeline/<shortLink>/run.md` with every stage's result block in order, then finish with:

```
PIPELINE: OK | STOPPED
CARD_URL: <card URL>
STAGE: <last stage run>
BRANCH: <branch or ->
BRANCH_URL: <url or ->
SPEC_URL: <url or ->
REASON: <for STOPPED>
```
