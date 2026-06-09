import { statSync } from 'node:fs'
import { worktreeList } from '../git.js'
import pc from 'picocolors'

function lastModified(path: string): string {
  try {
    const stat = statSync(path)
    return stat.mtime.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  } catch {
    return 'unknown'
  }
}

export function listWorktrees(): void {
  const worktrees = worktreeList()

  if (worktrees.length === 0) {
    console.log('No worktrees found.')
    return
  }

  const nameWidth = Math.max(6, ...worktrees.map((w) => w.name.length))
  const branchWidth = Math.max(6, ...worktrees.map((w) => w.branch.length))
  const pathWidth = Math.max(4, ...worktrees.map((w) => w.path.length))

  const header = [
    pc.bold('NAME').padEnd(nameWidth),
    pc.bold('BRANCH').padEnd(branchWidth),
    pc.bold('MODIFIED').padEnd(10),
    pc.bold('PATH'),
  ].join('  ')

  console.log(header)
  console.log(pc.dim('─'.repeat(nameWidth + branchWidth + pathWidth + 14)))

  for (const wt of worktrees) {
    const tag = wt.isMain ? pc.cyan(' (main)') : ''
    const name = wt.name.padEnd(nameWidth)
    const branch = (wt.branch || pc.dim('detached')).padEnd(branchWidth)
    const modified = lastModified(wt.path).padEnd(10)
    console.log(`${name}  ${branch}  ${modified}  ${wt.path}${tag}`)
  }
}
