import { cac } from 'cac'
import { newWorktree } from './commands/new.js'
import { listWorktrees } from './commands/list.js'
import { cleanWorktree } from './commands/clean.js'
import { runAgent } from './commands/run.js'
import * as log from './log.js'

const cli = cac('agentfork')

cli
  .command('new <name>', 'Create a new isolated worktree for an agent')
  .option('--branch <branch>', 'Branch name to use (defaults to <name>)')
  .option('--no-install', 'Skip running the install command from config')
  .action(async (name: string, opts: { branch?: string; install: boolean }) => {
    try {
      await newWorktree(name, { branch: opts.branch, install: opts.install })
    } catch (err) {
      log.error(String(err instanceof Error ? err.message : err))
      process.exit(1)
    }
  })

cli
  .command('list', 'List all worktrees for the current repo')
  .alias('ls')
  .action(() => {
    try {
      listWorktrees()
    } catch (err) {
      log.error(String(err instanceof Error ? err.message : err))
      process.exit(1)
    }
  })

cli
  .command('clean <name>', 'Remove a worktree and optionally delete its branch')
  .option('--force', 'Force removal even if worktree has uncommitted changes')
  .option('--delete-branch', 'Also delete the worktree branch')
  .action((name: string, opts: { force?: boolean; deleteBranch?: boolean }) => {
    try {
      cleanWorktree(name, { force: opts.force, deleteBranch: opts.deleteBranch })
    } catch (err) {
      log.error(String(err instanceof Error ? err.message : err))
      process.exit(1)
    }
  })

cli
  .command('run <name> <agent>', 'Run an agent inside a worktree')
  .action((name: string, agent: string) => {
    try {
      runAgent(name, agent)
    } catch (err) {
      log.error(String(err instanceof Error ? err.message : err))
      process.exit(1)
    }
  })

cli.help()
cli.version('0.1.0')

cli.parse()
