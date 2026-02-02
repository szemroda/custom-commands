# custom-commands

Custom Bun-powered terminal commands for git workflows.

## Setup

```bash
bun install
bun run link
```

## Commands

### `git-feat [branchName]`

Creates and checks out a feature branch from `origin/master`. If the name is not provided, it prompts for it. If the worktree has changes, it asks how to proceed:

- Stash changes
- Commit to current branch
- Move changes to the new feature branch
- Drop changes

### `git-pr`

Commits changes if needed (prompts for message), pushes with upstream, creates a PR using `gh` (base `master`), and opens the PR page in your browser. If the branch is one commit ahead of `origin/master`, it uses that commit subject as the PR title. Otherwise it prompts for a title.

## Requirements

- `git` installed and on PATH
- `gh` authenticated
- A remote named `origin` with a `master` branch
