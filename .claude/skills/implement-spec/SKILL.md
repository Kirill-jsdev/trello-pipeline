---
name: implement-spec
description: "Implement stage of the Trello pipeline. Runs the implementer subagent on an approved spec, checks the result with the verifier subagent, and retries with the verifier's FAIL report up to maxRetries times; on final failure moves the card to Blocked. Use after the spec is committed to the feature branch."
argument-hint: <card URL | short link>
---

# implement-spec

Implement the approved spec for the Trello card `$ARGUMENTS` and verify it. This stage does not commit.

Read `.claude/pipeline.json` first: `git.branchPrefix`, `paths.*`, `maxRetries`, `trello.lists.blocked.id`.

## 1. Preconditions

Stop on the first failure and report it.

1. Find the spec: `specs/<shortLink>-*/spec.md` (exactly one match). The short link is the part after `/c/` in the card URL.
2. The spec has `Status: Approved`.
3. The current branch is `<branchPrefix><shortLink>-<slug>`, matching the spec folder name.
4. `git status --short` is empty: the spec is committed and nothing else is pending.

## 2. Implement and verify

Create `.pipeline/<shortLink>/`. Then loop, starting with attempt 1:

1. Run the `implementer` subagent with the spec path.
   On attempts after the first, also pass the full previous verifier report and say: fix only the FAIL items.
   - `BLOCKED` → go to **Failure** with the implementer's reason.
2. Run the `verifier` subagent with the spec path.
   Save its report to `.pipeline/<shortLink>/verify-<attempt>.md`.
   - `PASS` → copy the report to `.pipeline/<shortLink>/verify.md` and go to **Output**.
   - `FAIL` → if `attempt <= maxRetries`, increment `attempt` and repeat; otherwise go to **Failure**.

Never edit code or tests yourself in this stage: every change goes through `implementer`, every verdict through `verifier`.

## 3. Failure

1. Read the card URL from the spec's `Trello:` line, then the card ARI with `trelloReadCard` (`action: "get"`).
2. Post a comment (`trelloWriteCard`, `action: "add_comment"`):
   ```
   🤖 Pipeline: implementation blocked after <attempt> attempt(s).

   <verifier AC table from the last report, or the implementer's BLOCKED reason>

   Branch: <branch> (uncommitted changes left for inspection)
   ```
3. Move the card to the `blocked` list.
4. Leave the working tree as it is, so a developer can inspect it. Do not commit or discard anything.

## Output

Finish with this block; the next stages rely on it.

```
IMPLEMENT: PASS | FAIL | BLOCKED
SPEC: specs/<shortLink>-<slug>/spec.md
BRANCH: <branch>
ATTEMPTS: <n>
VERIFY_REPORT: .pipeline/<shortLink>/verify.md
FILES:
- <path> — <change>
REASON: <for anything other than PASS>
```
