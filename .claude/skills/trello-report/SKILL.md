---
name: trello-report
description: Report stage of the Trello pipeline. Posts the final result to the Trello card — branch, spec link, commits and the AC table from the verifier — moves the card to Review and saves the report to .pipeline/<card>/report.md. Use after ship-branch code succeeds.
argument-hint: <card URL | short link>
---

# trello-report

Publish the pipeline result for the Trello card `$ARGUMENTS`. This stage changes nothing in git.

Read `.claude/pipeline.json` first: `trello.lists.review.id`, `paths.workdir`.

## 1. Inputs

Stop and report if any input is missing or not successful.

1. `.pipeline/<shortLink>/ship.md` starts with `SHIP_CODE: OK`. Take `BRANCH`, `BRANCH_URL`, `SPEC_URL`, `SPEC_COMMIT`, `CODE_COMMIT`.
2. `.pipeline/<shortLink>/verify.md` starts with `STATUS: PASS`. Take the AC table and the `CHECKS` line.
3. Count the attempts: the number of `.pipeline/<shortLink>/verify-*.md` files.
4. Read the card with `trelloReadCard` (`action: "get"`) to get its ARI and name.

## 2. Report

Build the report in Markdown (Trello renders it):

```
🤖 Pipeline: done — ready for review.

**Branch:** [<branch>](<BRANCH_URL>)
**Spec:** [specs/<shortLink>-<slug>/spec.md](<SPEC_URL>)
**Commits:**
1. [<spec sha>](<spec commit url>) docs(spec): …
2. [<code sha>](<code commit url>) <code commit subject>

**Acceptance Criteria** (verified in <n> attempt(s)):

| AC | Result | Evidence |
|---|---|---|
| AC-1 | ✅ PASS | <evidence from the verifier> |
| … | | |

**Checks:** <CHECKS line>

Next: review the spec and the code, then merge the branch and move this card to Done.
```

- Copy AC rows from the verifier's table as is; only prefix the result with ✅.
- Take commit subjects from git: `git log -1 --format=%s <sha>`.

## 3. Publish

1. Post the report as a comment (`trelloWriteCard`, `action: "add_comment"`).
2. Move the card to the `review` list.
3. Save the report to `.pipeline/<shortLink>/report.md`.

## Output

```
REPORT: OK | FAILED
CARD_URL: <card URL>
LIST: <list name>
REPORT_FILE: .pipeline/<shortLink>/report.md
REASON: <for FAILED>
```
