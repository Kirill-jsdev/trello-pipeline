---
name: ship-branch
description: Git stage of the Trello pipeline, in two modes. `spec` creates the feature branch from the base branch and commits the approved spec before any code. `code` commits the verified implementation with Spec and Trello-Card trailers, pushes the branch and confirms the commits on GitHub via gh api. Use `spec` after trello-intake and `code` after implement-spec passes.
argument-hint: spec|code <card URL | short link>
---

# ship-branch

Arguments: `$ARGUMENTS` — the mode (`spec` or `code`) followed by the card URL or short link.

Read `.claude/pipeline.json` first: `git.remote`, `git.baseBranch`, `git.branchPrefix`, `github.repo`, `paths.*`.
Find the spec: `specs/<shortLink>-*/spec.md` (exactly one match); `<slug>` is the rest of the folder name.
The branch is `<branchPrefix><shortLink>-<slug>`. The card URL is the spec's `Trello:` line.

Rules for both modes:
- Stage files by explicit path only; never `git add -A` or `git add .`.
- Never amend, rebase, force-push or push to the base branch (the guard-git hook blocks these anyway).
- Write commit messages with a heredoc (`git commit -F - <<'EOF' … EOF`) so the body and trailers survive intact.
- On any failure, stop and report it; do not try to repair the history.

## Mode `spec`

### Preconditions
1. The current branch is `git.baseBranch`.
2. `git status --short` shows only the spec folder as untracked; nothing else is modified.
3. The spec has `Status: Approved`.
4. The branch does not exist locally (`git rev-parse --verify <branch>` fails)
   or on GitHub (`gh api repos/<github.repo>/branches/<branch>` returns 404).

### Steps
1. `git switch -c <branch>`.
2. `git add specs/<shortLink>-<slug>/spec.md`.
3. Commit:
   ```
   docs(spec): add spec for <feature name from the spec title, lowercase>

   Acceptance Criteria: AC-1 … AC-n

   Trello-Card: <card URL>
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

### Output
```
SHIP_SPEC: OK | FAILED
BRANCH: <branch>
SPEC_COMMIT: <short sha>
REASON: <for FAILED>
```

## Mode `code`

### Preconditions
1. The current branch is `<branch>`, and its last commit is the spec commit or later.
2. `.pipeline/<shortLink>/verify.md` exists and starts with `STATUS: PASS`.
3. Every modified file is listed in the spec's "Affected files" (plus the spec itself after step 1 below).

### Steps
1. In the spec, change `Status: Approved` to `Status: Implemented`.
2. `git add` each file from "Affected files" and the spec.
3. Commit. Pick the type and scope from the change (`feat(api)` for a new endpoint, `fix(<area>)` for a bug fix):
   ```
   <type>(<scope>): <imperative summary, ≤ 72 chars>

   <1–3 lines: what changed and why>

   Acceptance Criteria:
   - AC-1: <short text> — <test name or check>
   - …

   Spec: specs/<shortLink>-<slug>/spec.md
   Trello-Card: <card URL>
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. `git push -u <remote> <branch>`.
5. Confirm on GitHub (read-only `gh api`):
   - `gh api repos/<github.repo>/branches/<branch> --jq .commit.sha` equals `git rev-parse HEAD`;
   - `gh api repos/<github.repo>/compare/<baseBranch>...<branch> --jq '.commits[] | [.sha[0:7], .commit.message | split("\n")[0], .html_url] | @tsv'`
     lists the spec commit followed by the code commit.
6. Save the results to `.pipeline/<shortLink>/ship.md`: branch, both commits with URLs, branch URL and spec URL.

### Output
```
SHIP_CODE: OK | FAILED
BRANCH: <branch>
BRANCH_URL: https://github.com/<github.repo>/tree/<branch>
SPEC_URL: https://github.com/<github.repo>/blob/<branch>/specs/<shortLink>-<slug>/spec.md
SPEC_COMMIT: <short sha> <url>
CODE_COMMIT: <short sha> <url>
REASON: <for FAILED>
```
