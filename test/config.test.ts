import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agentplex-config-test-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns defaults when no config file exists', () => {
    const config = loadConfig(tmpDir)
    expect(config.basePath).toBe('..')
    expect(config.copy).toContain('.env')
    expect(config.copy).toContain('.env.local')
    expect(config.agents.claude).toBe('claude')
    expect(config.agents.cursor).toBe('cursor .')
    expect(config.install).toBeUndefined()
  })

  it('loads and merges a config file', () => {
    writeFileSync(
      join(tmpDir, '.agentplex.json'),
      JSON.stringify({
        basePath: '/tmp/worktrees',
        install: 'pnpm install',
        copy: ['.env.production'],
        agents: { claude: 'claude --dangerously-skip-permissions' },
      }),
    )
    const config = loadConfig(tmpDir)
    expect(config.basePath).toBe('/tmp/worktrees')
    expect(config.install).toBe('pnpm install')
    expect(config.copy).toEqual(['.env.production'])
    expect(config.agents.claude).toBe('claude --dangerously-skip-permissions')
  })

  it('uses defaults for missing keys in partial config', () => {
    writeFileSync(join(tmpDir, '.agentplex.json'), JSON.stringify({ install: 'npm ci' }))
    const config = loadConfig(tmpDir)
    expect(config.basePath).toBe('..')
    expect(config.install).toBe('npm ci')
    expect(config.copy).toContain('.env')
  })

  it('handles malformed JSON gracefully', () => {
    writeFileSync(join(tmpDir, '.agentplex.json'), 'not-json{{{')
    const config = loadConfig(tmpDir)
    expect(config.basePath).toBe('..')
  })
})
