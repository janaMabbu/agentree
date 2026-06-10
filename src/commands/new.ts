import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { loadConfig } from '../config.js'
import { copyEnvFiles } from '../fs-helpers.js'
import { branchExists, getRepoName, getRepoRoot, worktreeAdd } from '../git.js'
import * as log from '../log.js'

export interface NewOptions {
  branch?: string
  install?: boolean
}

export async function newWorktree(name: string, opts: NewOptions): Promise<void> {
  const cwd = process.cwd()
  const config = loadConfig(cwd)
  const repoRoot = getRepoRoot(cwd)
  const repoName = getRepoName(cwd)

  const branchName = opts.branch ?? name
  const targetPath = resolve(repoRoot, config.basePath, `${repoName}-${name}`)

  log.info(`Creating worktree at ${targetPath}`)

  const create = !branchExists(branchName, repoRoot)
  if (create) {
    log.info(`Creating new branch: ${branchName}`)
  } else {
    log.info(`Using existing branch: ${branchName}`)
  }

  worktreeAdd(targetPath, branchName, create, repoRoot)
  log.success(`Worktree created`)

  copyEnvFiles(repoRoot, targetPath, config.copy)
  if (config.copy.length > 0) {
    log.dim(`  Copied env files: ${config.copy.join(', ')}`)
  }

  const runInstall = opts.install !== false && config.install != null
  if (runInstall && config.install) {
    log.info(`Running: ${config.install}`)
    await runCommand(config.install, targetPath)
  }

  log.success(`Done! Next steps:`)
  console.log(`  cd ${targetPath}`)
  console.log(`  agent-plex run ${name} claude`)
}

function runCommand(cmd: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      shell: true,
      cwd,
      stdio: 'inherit',
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command exited with code ${String(code)}: ${cmd}`))
      }
    })
    child.on('error', reject)
  })
}
