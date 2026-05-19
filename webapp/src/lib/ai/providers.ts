import type { AIProvider } from '@/lib/server/env'

export type AIErrorCode = 'missing_api_key' | 'invalid_api_key' | 'request_failed'

export interface CompletionRequest {
  system: string
  user: string
  maxTokens: number
}

export class AIProviderError extends Error {
  constructor(
    public code: AIErrorCode,
    public provider: AIProvider,
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export async function parseProviderError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (typeof data?.error?.message === 'string') return data.error.message
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.message === 'string') return data.message
  } catch {
    // Provider error bodies are not guaranteed to be JSON.
  }

  return response.statusText || 'Provider request failed'
}

export function providerLabel(provider: AIProvider) {
  if (provider === 'gpt-sw3') return 'GPT-SW3'
  if (provider === 'openai') return 'OpenAI'
  return 'Anthropic'
}
