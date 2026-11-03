---
name: trello-intake
description: "Intake stage of the Trello pipeline. Runs preflight checks, turns a Trello card into an approved spec in specs/<card>-<slug>/spec.md via the trello-analyst subagent, and moves the card to In progress (or to Blocked with questions). Use when starting work on a Trello card."
argument-hint: <card URL | short link>
---

# trello-intake

Turn the Trello card `$ARGUMENTS` into an approved spec. This stage does not create branches or commits.

Read `.claude/pipeline.json` first: board lists (`trello.lists.*.id`), `git.remote`, `git.baseBranch`, `paths.*`.

## 1. Preflight

Stop on the first failure, report it, and change nothing (no spec, no Trello updates).

1. `git status --short` is empty — the working tree is clean.
2. `git branch --show-current` equals `git.baseBranch`.
3. `git fetch <remote>`, then `git pull --ff-only <remote> <baseBranch>` — the branch is up to date.
4. `npm ci` succeeds, then `npm test` passes — the baseline is green.

## 2. Card

1. Read the card with `trelloReadCard` (`action: "get"`). Keep its ARI (`id`), URL and short link.
2. The card must be in the `ready` list (`trello.lists.ready.id`). Otherwise stop: report which list it is in.

## 3. Spec

Run the `trello-analyst` subagent with the card URL and handle its `STATUS`:

- **`NEEDS_CLARIFICATION`** — post a comment on the card (`trelloWriteCard`, `action: "add_comment"`):
  ```
  🤖 Pipeline: clarification needed before work can start.

  1. <question>
  2. <question>

  Update the card and move it back to "<ready list name>" to restart.
  ```
  Move the card to the `blocked` list (`action: "move"`). Stop.
- **`EXISTS`** — stop: the card was already processed; report the spec path. Do not touch Trello.
- **`READY`** — continue.

## 4. Spec validation

Check the spec file against `paths.specTemplate`. Every rule must hold:

- The Trello line holds the card URL; `Status: Draft`.
- All template sections are present and non-empty: Goal, User Story, Acceptance Criteria, Affected files, Test plan, Out of scope.
- AC IDs are sequential from `AC-1` with no gaps or duplicates.
- Every AC has a row in the Test plan; every test name in the plan starts with its AC ID (or the check is `npm test`).
- No template placeholders (`<...>`) or HTML comments are left.

If a rule fails, run `trello-analyst` once more with the list of violations after deleting the spec folder.
If it fails again, delete the spec folder, post a comment listing the violations, move the card to `blocked` and stop.

When the spec is valid, change `Status: Draft` to `Status: Approved`.

## 5. Trello

1. Move the card to the `inProgress` list.
2. Post a comment:
   ```
   🤖 Pipeline: work started.

   Spec: specs/<shortLink>-<slug>/spec.md
   Acceptance Criteria: AC-1 … AC-n
   ```

## Output

Finish with this block; the next stages rely on it.

```
INTAKE: READY | BLOCKED | EXISTS | PREFLIGHT_FAILED
CARD_ID: <card ARI>
CARD_URL: <card URL>
SHORT_LINK: <shortLink>
SLUG: <slug>
SPEC: specs/<shortLink>-<slug>/spec.md
AC: AC-1, …, AC-n
REASON: <for anything other than READY>
```
