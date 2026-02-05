/**
 * OpenRouter Adapter
 *
 * Supports:
 * - All models available on OpenRouter
 * - Claude, GPT-4, Llama, Mistral, etc.
 * - Automatic model routing
 * - Streaming
 *
 * OpenRouter provides a unified API for 100+ models
 */

import type { ChatMessage, ChatAdapter, ProviderConfig, ToolCall } from '../types'
import { generateId, parseSSEStream } from '../utils'

export interface OpenRouterConfig extends ProviderConfig {
  /** API key from openrouter.ai */
  apiKey?: string
  /** Model to use (e.g., 'anthropic/claude-3-opus', 'openai/gpt-4o', 'meta-llama/llama-3-70b') */
  model?: string
  /** Max tokens to generate */
  maxTokens?: number
  /** Temperature */
  temperature?: number
  /** System prompt */
  systemPrompt?: string
  /** Your app name (shown in OpenRouter dashboard) */
  appName?: string
  /** Your site URL (for rankings) */
  siteUrl?: string
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterStreamChunk {
  id: string
  model: string
  choices: Array<{
    delta: {
      content?: string
      role?: string
    }
    finish_reason?: string
  }>
}

export function createOpenRouterAdapter(config: OpenRouterConfig = {}): ChatAdapter {
  const {
    apiKey,
    baseUrl = 'https://openrouter.ai/api/v1',
    model = 'anthropic/claude-3-sonnet',
    maxTokens = 4096,
    temperature = 0.7,
    systemPrompt,
    appName = 'ChatVithAI',
    siteUrl,
    headers = {},
  } = config

  const getApiKey = () => {
    if (apiKey) return apiKey
    if (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) {
      return process.env.OPENROUTER_API_KEY
    }
    throw new Error('OpenRouter API key not provided')
  }

  const convertMessages = (messages: ChatMessage[]): OpenRouterMessage[] => {
    const result: OpenRouterMessage[] = []

    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt })
    }

    for (const m of messages) {
      result.push({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })
    }

    return result
  }

  // Detect features based on model
  const isClaude = model.includes('claude')
  const isGPT = model.includes('gpt')
  const supportsTools = isClaude || isGPT

  return {
    providerName: 'OpenRouter',

    features: {
      streaming: true,
      thinking: false, // OpenRouter doesn't expose thinking
      toolUse: supportsTools,
    },

    async sendMessage(messages, options = {}) {
      const { onStream, signal } = options

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
        'HTTP-Referer': siteUrl || 'https://github.com/vith-ai/chat-ui',
        'X-Title': appName,
        ...headers,
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: convertMessages(messages),
          stream: true,
        }),
        signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
      }

      let content = ''
      const toolCalls: ToolCall[] = []

      for await (const event of parseSSEStream(response)) {
        if (event.data === '[DONE]') break

        try {
          const data: OpenRouterStreamChunk = JSON.parse(event.data)
          const delta = data.choices[0]?.delta

          if (delta?.content) {
            content += delta.content
            onStream?.(delta.content)
          }
        } catch {
          // Skip invalid JSON
        }
      }

      return {
        id: generateId(),
        role: 'assistant',
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date(),
        metadata: {
          model,
          provider: 'openrouter',
        },
      }
    },
  }
}

export default createOpenRouterAdapter
