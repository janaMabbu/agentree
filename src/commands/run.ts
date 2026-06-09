import { spawn } from 'node:child_process'
import { loadConfig } from '../config.js'
import { worktreeList } from '../git.js'
import * as log from '../log.js'

export function runAgent(name: string, agentArg: string): void {
  const cwd = process.cwd()
  const worktrees = worktreeList(cwd)
  const target = worktrees.find((w) => !w.isMain && w.name === name)

  if (!target) {
    throw new Error(
      `No worktree named "${name}" found. Run "agentree list" to see available worktrees.`,
    )
  }

  const config = loadConfig(cwd)
  const cmd = config.agents[agentArg] ?? agentArg

  log.info(`Running "${cmd}" in ${target.path}`)

  const child = spawn(cmd, {
    shell: true,
    cwd: target.path,
    stdio: 'inherit',
  })

  child.on('error', (err) => {
    log.error(`Failed to start agent: ${err.message}`)
    process.exit(1)
  })

  child.on('close', (code) => {
    process.exit(code ?? 0)
  })
}
