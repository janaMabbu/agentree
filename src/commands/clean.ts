import { deleteBranchForce, worktreeList, worktreePrune, worktreeRemove } from '../git.js'
import * as log from '../log.js'

export interface CleanOptions {
  force?: boolean
  deleteBranch?: boolean
}

export function cleanWorktree(name: string, opts: CleanOptions): void {
  const worktrees = worktreeList()
  const target = worktrees.find((w) => !w.isMain && w.name === name)

  if (!target) {
    throw new Error(
      `No worktree named "${name}" found. Run "agentplex list" to see available worktrees.`,
    )
  }

  log.info(`Removing worktree at ${target.path}`)
  worktreeRemove(target.path, opts.force ?? false)
  log.success(`Worktree removed`)

  if (opts.deleteBranch && target.branch && target.branch !== '(detached)') {
    log.info(`Deleting branch: ${target.branch}`)
    try {
      deleteBranchForce(target.branch)
      log.success(`Branch deleted`)
    } catch (err) {
      log.warn(`Could not delete branch "${target.branch}": ${String(err)}`)
    }
  }

  worktreePrune()
  log.dim('  Pruned stale worktree references')
}
