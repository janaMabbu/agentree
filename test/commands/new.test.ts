import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { createTmpRepo } from '../helpers.js'
import { worktreeList } from '../../src/git.js'
import { newWorktree } from '../../src/commands/new.js'

describe('newWorktree command', () => {
  let repoDir: string
  let cleanup: () => void
  const createdPaths: string[] = []

  beforeEach(() => {
    const repo = createTmpRepo()
    repoDir = repo.repoDir
    cleanup = repo.cleanup
    vi.spyOn(process, 'cwd').mockReturnValue(repoDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    for (const p of createdPaths) {
      try {
        execFileSync('git', ['worktree', 'remove', '--force', p], { cwd: repoDir, stdio: 'pipe' })
      } catch { /* ignore */ }
      rmSync(p, { recursive: true, force: true })
    }
    createdPaths.length = 0
    cleanup()
  })

  it('creates a worktree at the expected path', async () => {
    const repoName = basename(repoDir)
    // resolve parent to get real path (avoids macOS /var vs /private/var)
    const parentReal = realpathSync(join(repoDir, '..'))
    const expectedPath = join(parentReal, `${repoName}-myfeature`)
    createdPaths.push(expectedPath)

    await newWorktree('myfeature', {})

    expect(existsSync(expectedPath)).toBe(true)
    const list = worktreeList(repoDir)
    expect(list.some((w) => w.path === expectedPath)).toBe(true)
  })

  it('copies .env files when present', async () => {
    writeFileSync(join(repoDir, '.env'), 'SECRET=abc\n')

    const repoName = basename(repoDir)
    const parentReal = realpathSync(join(repoDir, '..'))
    const targetPath = join(parentReal, `${repoName}-envtest`)
    createdPaths.push(targetPath)

    await newWorktree('envtest', {})

    expect(existsSync(join(targetPath, '.env'))).toBe(true)
  })

  it('skips copy when source env file is missing (no error)', async () => {
    const repoName = basename(repoDir)
    const parentReal = realpathSync(join(repoDir, '..'))
    const targetPath = join(parentReal, `${repoName}-noenv`)
    createdPaths.push(targetPath)

    await expect(newWorktree('noenv', {})).resolves.toBeUndefined()
    expect(existsSync(targetPath)).toBe(true)
  })

  it('uses existing branch when it already exists', async () => {
    execFileSync('git', ['checkout', '-b', 'existing-branch'], { cwd: repoDir, stdio: 'pipe' })
    execFileSync('git', ['checkout', '-'], { cwd: repoDir, stdio: 'pipe' })

    const repoName = basename(repoDir)
    const parentReal = realpathSync(join(repoDir, '..'))
    const targetPath = join(parentReal, `${repoName}-existing`)
    createdPaths.push(targetPath)

    await newWorktree('existing', { branch: 'existing-branch' })

    const list = worktreeList(repoDir)
    const wt = list.find((w) => w.path === targetPath)
    expect(wt?.branch).toBe('existing-branch')
  })
})
