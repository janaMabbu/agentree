import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface AgentplexConfig {
  basePath: string
  copy: string[]
  install?: string
  agents: Record<string, string>
}

const DEFAULTS: AgentplexConfig = {
  basePath: '..',
  copy: ['.env', '.env.local'],
  agents: {
    claude: 'claude',
    cursor: 'cursor .',
  },
}

function findConfigFile(startDir: string): string | null {
  let dir = startDir
  let parent = dirname(dir)
  while (parent !== dir) {
    const candidate = join(dir, '.agentplex.json')
    if (existsSync(candidate)) return candidate
    dir = parent
    parent = dirname(dir)
  }
  // Check root directory too
  const candidate = join(dir, '.agentplex.json')
  return existsSync(candidate) ? candidate : null
}

export function loadConfig(cwd: string): AgentplexConfig {
  const configPath = findConfigFile(cwd)
  if (!configPath) return { ...DEFAULTS, agents: { ...DEFAULTS.agents } }

  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf8'))
  } catch {
    return { ...DEFAULTS, agents: { ...DEFAULTS.agents } }
  }

  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULTS, agents: { ...DEFAULTS.agents } }
  }

  const file = raw as Partial<AgentplexConfig>
  return {
    basePath: typeof file.basePath === 'string' ? file.basePath : DEFAULTS.basePath,
    copy: Array.isArray(file.copy) ? (file.copy as string[]) : DEFAULTS.copy,
    install: typeof file.install === 'string' ? file.install : undefined,
    agents:
      typeof file.agents === 'object' && file.agents !== null
        ? (file.agents as Record<string, string>)
        : { ...DEFAULTS.agents },
  }
}
