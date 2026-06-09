import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { createTmpRepo } from '../helpers.js'
import { worktreeList, branchExists } from '../../src/git.js'
import { cleanWorktree } from '../../src/commands/clean.js'

describe('cleanWorktree command', () => {
  let repoDir: string
  let cleanup: () => void

  beforeEach(() => {
    const repo = createTmpRepo()
    repoDir = repo.repoDir
    cleanup = repo.cleanup
    vi.spyOn(process, 'cwd').mockReturnValue(repoDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  function addWorktree(name: string): string {
    // realpathSync resolves macOS /var -> /private/var so paths match git output
    const wtDir = realpathSync(mkdtempSync(join(tmpdir(), `agentplex-clean-${name}-`)))
    execFileSync('git', ['worktree', 'add', '-b', name, wtDir], { cwd: repoDir, stdio: 'pipe' })
    return wtDir
  }

  it('removes a worktree by name', () => {
    const wtDir = addWorktree('clean-test')
    const wtName = basename(wtDir)

    const listBefore = worktreeList(repoDir)
    expect(listBefore.some((w) => w.path === wtDir)).toBe(true)

    cleanWorktree(wtName, {})

    const listAfter = worktreeList(repoDir)
    expect(listAfter.some((w) => w.path === wtDir)).toBe(false)
    expect(existsSync(wtDir)).toBe(false)

    // Cleanup branch
    try {
      execFileSync('git', ['branch', '-D', 'clean-test'], { cwd: repoDir, stdio: 'pipe' })
    } catch { /* ignore */ }
    rmSync(wtDir, { recursive: true, force: true })
  })

  it('removes worktree and deletes branch with --delete-branch', () => {
    const wtDir = addWorktree('delete-branch-test')
    const wtName = basename(wtDir)

    cleanWorktree(wtName, { deleteBranch: true })

    expect(existsSync(wtDir)).toBe(false)
    expect(branchExists('delete-branch-test', repoDir)).toBe(false)
    rmSync(wtDir, { recursive: true, force: true })
  })

  it('throws when worktree name is not found', () => {
    expect(() => cleanWorktree('does-not-exist', {})).toThrow(/No worktree named/)
  })
})
