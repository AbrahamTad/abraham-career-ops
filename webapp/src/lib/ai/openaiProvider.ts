import { getAIProviderKey, getOptionalEnv } from '@/lib/server/env'
import { AIProviderError, type CompletionRequest, parseProviderError } from './providers'

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

export async function openaiProvider({ system, user, maxTokens }: CompletionRequest): Promise<string> {
  const provider = 'openai'
  let apiKey: string
  try {
    apiKey = getAIProviderKey(provider)
  } catch {
    throw new AIProviderError('missing_api_key', provider, 'Missing OPENAI_API_KEY.')
  }
  let response: Response

  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getOptionalEnv('OPENAI_MODEL') ?? DEFAULT_OPENAI_MODEL,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
  } catch (error) {
    throw new AIProviderError(
      'request_failed',
      provider,
      error instanceof Error ? error.message : 'OpenAI request could not be sent.'
    )
  }

  if (!response.ok) {
    const message = await parseProviderError(response)
    throw new AIProviderError(response.status === 401 ? 'invalid_api_key' : 'request_failed', provider, message, response.status)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string') {
    throw new AIProviderError('request_failed', provider, 'Unexpected OpenAI response format.')
  }

  return text
}
