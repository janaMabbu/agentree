import { execFileSync } from 'node:child_process'
import { basename } from 'node:path'

export interface WorktreeInfo {
  path: string
  branch: string
  head: string
  name: string
  isMain: boolean
}

function git(args: string[], cwd?: string): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    cwd: cwd ?? process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim()
}

export function getRepoRoot(cwd?: string): string {
  return git(['rev-parse', '--show-toplevel'], cwd)
}

export function getRepoName(cwd?: string): string {
  return basename(getRepoRoot(cwd))
}

export function branchExists(branch: string, cwd?: string): boolean {
  try {
    git(['rev-parse', '--verify', branch], cwd)
    return true
  } catch {
    return false
  }
}

export function worktreeAdd(
  worktreePath: string,
  branch: string,
  create: boolean,
  cwd?: string,
): void {
  const args = ['worktree', 'add', worktreePath]
  if (create) {
    args.push('-b', branch)
  } else {
    args.push(branch)
  }
  git(args, cwd)
}

export function worktreeList(cwd?: string): WorktreeInfo[] {
  const output = git(['worktree', 'list', '--porcelain'], cwd)
  const worktrees: WorktreeInfo[] = []
  const blocks = output.split('\n\n').filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n')
    let path = ''
    let head = ''
    let branch = ''

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.slice('worktree '.length)
      } else if (line.startsWith('HEAD ')) {
        head = line.slice('HEAD '.length)
      } else if (line.startsWith('branch ')) {
        const ref = line.slice('branch '.length)
        branch = ref.replace(/^refs\/heads\//, '')
      } else if (line === 'detached') {
        branch = '(detached)'
      }
    }

    if (!path) continue

    worktrees.push({
      path,
      branch,
      head,
      name: basename(path),
      isMain: worktrees.length === 0,
    })
  }

  return worktrees
}

export function worktreeRemove(worktreePath: string, force: boolean, cwd?: string): void {
  const args = ['worktree', 'remove', worktreePath]
  if (force) args.push('--force')
  git(args, cwd)
}

export function worktreePrune(cwd?: string): void {
  git(['worktree', 'prune'], cwd)
}

export function deleteBranch(branch: string, cwd?: string): void {
  git(['branch', '-d', branch], cwd)
}

export function deleteBranchForce(branch: string, cwd?: string): void {
  git(['branch', '-D', branch], cwd)
}
