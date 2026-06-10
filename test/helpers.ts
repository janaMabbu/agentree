import { execFileSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface TmpRepo {
  repoDir: string
  cleanup: () => void
}

export function createTmpRepo(): TmpRepo {
  // realpathSync resolves macOS /var -> /private/var symlink so paths match git output
  const repoDir = realpathSync(mkdtempSync(join(tmpdir(), 'agentfork-test-')))

  function git(args: string[]): void {
    execFileSync('git', args, { cwd: repoDir, stdio: 'pipe' })
  }

  git(['init'])
  git(['config', 'user.email', 'test@agentfork.test'])
  git(['config', 'user.name', 'Agentree Test'])

  // Need at least one commit for branches and worktrees to work
  writeFileSync(join(repoDir, 'README.md'), '# test\n')
  git(['add', 'README.md'])
  git(['commit', '-m', 'init'])

  return {
    repoDir,
    cleanup: () => {
      try {
        // Remove any worktrees first
        execFileSync('git', ['worktree', 'prune'], { cwd: repoDir, stdio: 'pipe' })
      } catch {
        // ignore
      }
      rmSync(repoDir, { recursive: true, force: true })
    },
  }
}
