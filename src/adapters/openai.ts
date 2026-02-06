/**
 * OpenAI API Adapter
 *
 * Supports:
 * - OpenAI API (api.openai.com)
 * - Azure OpenAI
 * - Any OpenAI-compatible API (Groq, Together, etc.)
 * - Tool/function calling
 * - Streaming
 */

import type { ChatMessage, ChatAdapter, ProviderConfig, ToolCall } from '../types'
import { generateId, parseSSEStream } from '../utils'

export interface OpenAIConfig extends ProviderConfig {
  /** API key */
  apiKey?: string
  /** Model to use (default: gpt-4o) */
  model?: string
  /** Max tokens to generate */
  maxTokens?: number
  /** Temperature */
  temperature?: number
  /** System prompt */
  systemPrompt?: string
  /** Organization ID (optional) */
  organization?: string
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
}

interface OpenAIStreamChunk {
  id: string
  choices: Array<{
    delta: {
      content?: string
      tool_calls?: Array<{
        index: number
        id?: string
        function?: { name?: string; arguments?: string }
      }>
    }
    finish_reason?: string
  }>
}

export function createOpenAIAdapter(config: OpenAIConfig = {}): ChatAdapter {
  const {
    apiKey,
    baseUrl = 'https://api.openai.com/v1',
    model = 'gpt-4o',
    maxTokens = 4096,
    temperature = 0.7,
    systemPrompt,
    organization,
    headers = {},
  } = config

  const getApiKey = () => {
    if (apiKey) return apiKey
    if (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) {
      return process.env.OPENAI_API_KEY
    }
    throw new Error('OpenAI API key not provided')
  }

  const convertMessages = (messages: ChatMessage[]): OpenAIMessage[] => {
    const result: OpenAIMessage[] = []

    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt })
    }

    for (const m of messages) {
      if (m.role === 'system') {
        result.push({ role: 'system', content: m.content })
      } else {
        result.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })
      }
    }

    return result
  }

  return {
    providerName: 'OpenAI',

    features: {
      streaming: true,
      thinking: false, // OpenAI doesn't have native thinking
      toolUse: true,
    },

    async sendMessage(messages, options = {}) {
      const { onStream, onToolCall, signal } = options

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
        ...headers,
      }

      if (organization) {
        requestHeaders['OpenAI-Organization'] = organization
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
        throw new Error(`OpenAI API error: ${response.status} - ${error}`)
      }

      let content = ''
      const toolCalls: ToolCall[] = []
      const toolCallArgs: Record<number, string> = {}

      for await (const event of parseSSEStream(response)) {
        if (event.data === '[DONE]') break

        try {
          const data: OpenAIStreamChunk = JSON.parse(event.data)
          const delta = data.choices[0]?.delta

          if (delta?.content) {
            content += delta.content
            onStream?.(delta.content)
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.id) {
                // New tool call starting
                const toolCall: ToolCall = {
                  id: tc.id,
                  name: tc.function?.name || 'unknown',
                  input: {},
                  status: 'running',
                }
                toolCalls.push(toolCall)
                toolCallArgs[tc.index] = ''
                onToolCall?.(toolCall)
              }

              if (tc.function?.arguments) {
                toolCallArgs[tc.index] = (toolCallArgs[tc.index] || '') + tc.function.arguments
              }
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }

      // Parse tool call arguments
      for (let i = 0; i < toolCalls.length; i++) {
        if (toolCallArgs[i]) {
          try {
            toolCalls[i].input = JSON.parse(toolCallArgs[i])
          } catch {
            toolCalls[i].input = { raw: toolCallArgs[i] }
          }
          toolCalls[i].status = 'complete'
          onToolCall?.(toolCalls[i])
        }
      }

      return {
        id: generateId(),
        role: 'assistant',
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date(),
      }
    },
  }
}

export default createOpenAIAdapter
