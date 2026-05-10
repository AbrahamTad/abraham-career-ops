import fs from 'fs'
import path from 'path'

export type AIProvider = 'openai' | 'anthropic'

const AI_ENV_NAMES = new Set(['AI_PROVIDER', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'])

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}

  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce<Record<string, string>>((env, line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match || !AI_ENV_NAMES.has(match[1])) return env

    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[match[1]] = value.trim()
    return env
  }, {})
}

function readLocalAIEnv(name: string): string | undefined {
  if (process.env.NODE_ENV === 'production') return undefined

  const envDir = process.cwd()
  const values = {
    ...parseEnvFile(path.join(envDir, '.env')),
    ...parseEnvFile(path.join(envDir, '.env.local')),
  }

  return values[name]
}

function readEnv(name: string): string {
  return (readLocalAIEnv(name) ?? process.env[name] ?? '').trim()
}

export function getSelectedAIProvider(): AIProvider {
  const configured = readEnv('AI_PROVIDER').toLowerCase()

  if (configured === 'openai' || configured === 'anthropic') {
    return configured
  }

  if (configured) {
    throw new Error('AI_PROVIDER must be either "openai" or "anthropic".')
  }

  return readEnv('ANTHROPIC_API_KEY') ? 'anthropic' : 'openai'
}

export function getAIProviderKey(provider: AIProvider): string {
  const envName = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
  const key = readEnv(envName)

  if (!key) {
    throw new Error(`Missing ${envName}.`)
  }

  return key
}
