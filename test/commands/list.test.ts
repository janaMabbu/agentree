import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createTmpRepo } from '../helpers.js'
import { worktreeList } from '../../src/git.js'
import { listWorktrees } from '../../src/commands/list.js'

describe('listWorktrees command', () => {
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

  it('returns the main worktree', () => {
    const list = worktreeList(repoDir)
    expect(list.length).toBeGreaterThanOrEqual(1)
    const main = list[0]
    expect(main?.isMain).toBe(true)
    expect(main?.path).toBe(repoDir)
  })

  it('includes all worktrees after adding one', () => {
    const wtDir = realpathSync(mkdtempSync(join(tmpdir(), 'agentplex-list-wt-')))
    try {
      execFileSync('git', ['worktree', 'add', '-b', 'list-test-branch', wtDir], {
        cwd: repoDir,
        stdio: 'pipe',
      })

      const list = worktreeList(repoDir)
      expect(list.length).toBe(2)
      expect(list.some((w) => w.path === wtDir)).toBe(true)
      expect(list.some((w) => w.branch === 'list-test-branch')).toBe(true)
    } finally {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', wtDir], { cwd: repoDir, stdio: 'pipe' })
        execFileSync('git', ['branch', '-D', 'list-test-branch'], { cwd: repoDir, stdio: 'pipe' })
      } catch { /* ignore */ }
      rmSync(wtDir, { recursive: true, force: true })
    }
  })

  it('prints output without throwing', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    expect(() => listWorktrees()).not.toThrow()
    logSpy.mockRestore()
  })
})
