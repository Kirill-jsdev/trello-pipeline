# trello-pipeline

Put a task in Trello and run one command. A branch with working code and tests appears on GitHub,
and a report appears on the card.

[Claude Code] does everything:

1. reads the card;
2. writes a specification;
3. writes the code and tests;
4. checks its own result;
5. commits and pushes the branch to GitHub;
6. reports back on the card.

Inside is a small Node.js + TypeScript + Express HTTP service that the pipeline works on.

## Requirements

- Node.js 24+
- [Claude Code]
- [GitHub CLI], logged in to an account with access to the repository: `gh auth login`
- Access to the Trello board

## Setup (once)

```bash
git clone https://github.com/Kirill-jsdev/trello-pipeline.git
cd trello-pipeline
npm ci
claude
```

In the Claude session:

1. Type `/mcp`.
2. Choose `trello` → **Authenticate**.
3. Sign in to Atlassian in the browser and grant access.

Done: `/mcp` shows `trello ✔ connected`.

## Usage

**1. Create a card** in the **To Do** list on the Trello board:

```
Name:         Create /health endpoint

Description:  As an API user, I want a /health endpoint so that I can check the service's availability.

              Acceptance Criteria:
              - GET /health returns HTTP 200;
              - the response has the format {"status": "ok"};
              - the endpoint is covered by an automated test;
              - existing tests continue to pass.
```

Every criterion must be verifiable: not "works fast", but "returns 200".

**2. Run the pipeline** from the `main` branch with a clean working tree:

```bash
npm run pipeline -- https://trello.com/c/<card id>
```

Or in a Claude session:

```
/trello-to-commit https://trello.com/c/<card id>
```

**3. Wait for the result** (usually a few minutes):

- a branch `feature/<id>-<name>` appears on GitHub with two commits: the specification, then the code;
- the card moves to **Review** with a comment containing links and a table of checks;
- the console prints `PIPELINE: OK`.

**4. Review and accept:** read the spec and the code, merge the branch into `main`, move the card to **Done**.

## If the pipeline stops

The card goes to **Blocked**, and the last comment explains why. Most often:

- **Clarification needed.** Answer the questions, fix the card and move it back to **To Do**.
- **Dirty working tree or not on `main`.** Clean up and run again.

## Project commands

| Command | What it does |
|---|---|
| `npm run pipeline -- <card>` | Run the pipeline |
| `npm test` | Tests |
| `npm run dev` | Dev server on `http://localhost:3000` |
| `npm run build` / `npm start` | Build and run the built server |

## More

How the pipeline works inside, what the agents are allowed to do, how to configure and troubleshoot it: [docs/PIPELINE.md](docs/PIPELINE.md).

[Claude Code]: https://claude.com/claude-code
[GitHub CLI]: https://cli.github.com/
