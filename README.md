# agentfork

> Spawn isolated git worktrees for AI coding agents.

## The problem

Running Claude Code, Cursor, or aider in parallel? Each agent needs its own directory or they stomp on each other's changes. `git worktree` gives you isolated folders, but it doesn't copy your `.env` files, run `npm install`, or keep track of what's where.

`agentfork` closes the gap in three commands.

## Install

```bash
npm install -g agentfork
# or
pnpm add -g agentfork
```

## Quickstart

```bash
# 1. Create an isolated worktree for a new feature
agentfork new search

# 2. Open Claude Code inside it
agentfork run search claude

# 3. See all your worktrees
agentfork list
```

## Commands

### `agentfork new <name> [options]`

Creates a worktree at `../<repo>-<name>`, copies declared env files, and optionally runs your install command.

| Option | Description |
|---|---|
| `--branch <branch>` | Branch name to use (defaults to `<name>`) |
| `--no-install` | Skip the install command from config |

```bash
agentfork new search                     # worktree on new `search` branch
agentfork new hotfix --branch fix-pay    # worktree using existing branch `fix-pay`
agentfork new experiment --no-install    # skip npm/pnpm install
```

### `agentfork list` (alias: `agentfork ls`)

Lists all worktrees for the current repo: name, branch, last modified date, path.

```bash
agentfork list
```

```
NAME       BRANCH        MODIFIED    PATH
──────────────────────────────────────────────────────────
myrepo     main          Jun 07 2026 /Users/you/myrepo  (main)
myrepo-s…  search        Jun 08 2026 /Users/you/myrepo-search
myrepo-h…  fix-pay       Jun 08 2026 /Users/you/myrepo-hotfix
```

### `agentfork run <name> <agent>`

Starts an agent inside a named worktree. The agent command is resolved via `config.agents`, falling back to the raw string.

```bash
agentfork run search claude      # runs `claude` in the search worktree
agentfork run hotfix cursor      # runs `cursor .` in the hotfix worktree
agentfork run search "aider ."   # raw command
```

### `agentfork clean <name> [options]`

Removes a worktree. Optionally deletes its branch and prunes stale refs.

| Option | Description |
|---|---|
| `--force` | Force removal even with uncommitted changes |
| `--delete-branch` | Also delete the worktree's git branch |

```bash
agentfork clean search
agentfork clean hotfix --delete-branch
agentfork clean experiment --force --delete-branch
```

## Config

Place `.agentfork.json` in your repo root. All keys are optional.

```json
{
  "basePath": "..",
  "copy": [".env.local", ".env.development"],
  "install": "pnpm install",
  "agents": {
    "claude": "claude",
    "cursor": "cursor ."
  }
}
```

| Key | Default | Description |
|---|---|---|
| `basePath` | `".."` | Where to create worktrees, relative to repo root |
| `copy` | `[".env", ".env.local"]` | Files to copy into each new worktree |
| `install` | _(none)_ | Command to run in the new worktree after creation |
| `agents` | `{ "claude": "claude", "cursor": "cursor ." }` | Aliases for agent commands |

## Common workflows

### Two agents on the same repo

```bash
agentfork new feature-a    # agent 1 works here
agentfork new feature-b    # agent 2 works here

# In two separate terminals:
agentfork run feature-a claude
agentfork run feature-b cursor
```

### Reviewing an agent's work

```bash
agentfork list             # see what branches exist
cd /path/to/myrepo-feature-a
git diff main             # review changes
git merge feature-a       # merge when happy
agentfork clean feature-a --delete-branch
```

### Using an existing branch

```bash
git fetch origin fix-important-bug
agentfork new bugfix --branch fix-important-bug
agentfork run bugfix claude
```

### With custom install

```json
{
  "install": "pnpm install --frozen-lockfile"
}
```

```bash
agentfork new myfeature    # runs pnpm install automatically
```

> **GIF placeholder** — parallel agents demo coming soon.

## FAQ

**What about pnpm workspaces?**
Set `"install": "pnpm install"` in `.agentfork.json`. Each worktree gets its own `node_modules` via pnpm's virtual store — it's fast.

**What about monorepos?**
`agentfork` works at the git repo level. For monorepos, set `basePath` to a sibling directory and `install` to your workspace install command. Multi-repo support is out of scope for v1.

**Will this conflict with my main worktree?**
No. Each worktree is a fully independent directory with its own branch. Changes in one cannot affect another until you merge.

**Can I use it with aider?**
Yes. Set `"agents": { "aider": "aider" }` in `.agentfork.json` or just run `agentfork run <name> "aider ."`.

## Running tests

```sh
npm install && npm test
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/janaMabbu/agentfork/issues/new).

## Author

[github/janaMabbu](https://github.com/janaMabbu)

## License

Released under the [MIT license](LICENSE).
