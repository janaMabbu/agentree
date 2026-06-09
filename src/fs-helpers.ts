import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function copyEnvFiles(srcDir: string, destDir: string, patterns: string[]): void {
  for (const pattern of patterns) {
    const src = join(srcDir, pattern)
    if (!existsSync(src)) continue
    const dest = join(destDir, pattern)
    const destParent = dirname(dest)
    if (!existsSync(destParent)) {
      mkdirSync(destParent, { recursive: true })
    }
    copyFileSync(src, dest)
  }
}
