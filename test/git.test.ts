import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename } from 'node:path'
import { createTmpRepo } from './helpers.js'
import {
  branchExists,
  getRepoName,
  getRepoRoot,
  worktreeAdd,
  worktreeList,
  worktreePrune,
  worktreeRemove,
} from '../src/git.js'

describe('git helpers', () => {
  let repoDir: string
  let cleanup: () => void

  beforeEach(() => {
    const repo = createTmpRepo()
    repoDir = repo.repoDir
    cleanup = repo.cleanup
  })

  afterEach(() => {
    cleanup()
  })

  it('getRepoRoot returns the repo directory', () => {
    const root = getRepoRoot(repoDir)
    expect(root).toBe(repoDir)
  })

  it('getRepoName returns the directory basename', () => {
    const name = getRepoName(repoDir)
    expect(name).toBe(basename(repoDir))
  })

  it('branchExists returns true for existing branch', () => {
    expect(branchExists('main', repoDir) || branchExists('master', repoDir)).toBe(true)
  })

  it('branchExists returns false for non-existent branch', () => {
    expect(branchExists('this-branch-does-not-exist-xyz', repoDir)).toBe(false)
  })

  it('worktreeList returns at least the main worktree', () => {
    const list = worktreeList(repoDir)
    expect(list.length).toBeGreaterThanOrEqual(1)
    const main = list[0]
    expect(main?.isMain).toBe(true)
    expect(main?.path).toBe(repoDir)
  })

  it('worktreeAdd creates a new worktree on a new branch', () => {
    // realpathSync resolves macOS /var -> /private/var symlink
    const wtDir = realpathSync(mkdtempSync(join(tmpdir(), 'agentplex-wt-')))
    try {
      worktreeAdd(wtDir, 'feature-test', true, repoDir)
      const list = worktreeList(repoDir)
      const found = list.find((w) => w.path === wtDir)
      expect(found).toBeDefined()
      expect(found?.branch).toBe('feature-test')
    } finally {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', wtDir], { cwd: repoDir, stdio: 'pipe' })
        execFileSync('git', ['branch', '-D', 'feature-test'], { cwd: repoDir, stdio: 'pipe' })
      } catch { /* ignore cleanup errors */ }
      rmSync(wtDir, { recursive: true, force: true })
    }
  })

  it('worktreeRemove removes the worktree', () => {
    const wtDir = realpathSync(mkdtempSync(join(tmpdir(), 'agentplex-wt-')))
    try {
      worktreeAdd(wtDir, 'remove-test', true, repoDir)
      worktreeRemove(wtDir, false, repoDir)
      worktreePrune(repoDir)

      const list = worktreeList(repoDir)
      expect(list.find((w) => w.path === wtDir)).toBeUndefined()
    } finally {
      try {
        execFileSync('git', ['branch', '-D', 'remove-test'], { cwd: repoDir, stdio: 'pipe' })
      } catch { /* ignore */ }
      rmSync(wtDir, { recursive: true, force: true })
    }
  })
})
