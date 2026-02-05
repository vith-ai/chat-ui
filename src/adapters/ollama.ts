/**
 * Ollama Adapter
 *
 * Supports:
 * - All Ollama models (Llama, Mistral, CodeLlama, etc.)
 * - Local inference
 * - Streaming
 * - Custom model files
 *
 * Ollama runs models locally on your machine
 */

import type { ChatMessage, ChatAdapter, ProviderConfig } from '../types'
import { generateId } from '../utils'

export interface OllamaConfig extends ProviderConfig {
  /** Ollama server URL (default: http://localhost:11434) */
  baseUrl?: string
  /** Model name (e.g., 'llama3', 'mistral', 'codellama') */
  model?: string
  /** System prompt */
  systemPrompt?: string
  /** Context window size */
  numCtx?: number
  /** Temperature */
  temperature?: number
  /** Keep model loaded in memory */
  keepAlive?: string
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaStreamChunk {
  model: string
  message?: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  eval_count?: number
}

export function createOllamaAdapter(config: OllamaConfig = {}): ChatAdapter {
  const {
    baseUrl = 'http://localhost:11434',
    model = 'llama3',
    systemPrompt,
    numCtx = 4096,
    temperature = 0.7,
    keepAlive = '5m',
  } = config

  const convertMessages = (messages: ChatMessage[]): OllamaMessage[] => {
    const result: OllamaMessage[] = []

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

  return {
    providerName: 'Ollama',

    features: {
      streaming: true,
      thinking: false,
      toolUse: false, // Basic Ollama doesn't support tool calling
    },

    async sendMessage(messages, options = {}) {
      const { onStream, signal } = options

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: convertMessages(messages),
          stream: true,
          options: {
            num_ctx: numCtx,
            temperature,
          },
          keep_alive: keepAlive,
        }),
        signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Ollama API error: ${response.status} - ${error}`)
      }

      let content = ''

      const reader = response.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(Boolean)

          for (const line of lines) {
            try {
              const data: OllamaStreamChunk = JSON.parse(line)

              if (data.message?.content) {
                content += data.message.content
                onStream?.(data.message.content)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        metadata: {
          model,
          provider: 'ollama',
        },
      }
    },
  }
}

export default createOllamaAdapter

/**
 * Helper to list available models from Ollama
 */
export async function listOllamaModels(baseUrl = 'http://localhost:11434'): Promise<string[]> {
  const response = await fetch(`${baseUrl}/api/tags`)
  if (!response.ok) {
    throw new Error('Failed to list Ollama models')
  }
  const data = await response.json()
  return data.models?.map((m: { name: string }) => m.name) || []
}

/**
 * Helper to pull a model from Ollama
 */
export async function pullOllamaModel(
  model: string,
  baseUrl = 'http://localhost:11434',
  onProgress?: (progress: number) => void
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: true }),
  })

  if (!response.ok) {
    throw new Error(`Failed to pull model: ${model}`)
  }

  const reader = response.body?.getReader()
  if (reader) {
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.total && data.completed) {
            onProgress?.(data.completed / data.total)
          }
        } catch {
          // Skip
        }
      }
    }
  }
}
