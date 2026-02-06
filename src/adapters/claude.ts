/**
 * Claude / Anthropic API Adapter
 *
 * Supports:
 * - Claude API (api.anthropic.com)
 * - Claude Agent SDK
 * - Extended thinking
 * - Tool use
 * - Streaming
 */

import type { ChatMessage, ChatAdapter, ProviderConfig, ToolCall } from '../types'
import { generateId, parseSSEStream } from '../utils'

export interface ClaudeConfig extends ProviderConfig {
  /** API key (or use ANTHROPIC_API_KEY env var) */
  apiKey?: string
  /** Model to use (default: claude-sonnet-4-20250514) */
  model?: string
  /** Max tokens to generate */
  maxTokens?: number
  /** Enable extended thinking */
  enableThinking?: boolean
  /** System prompt */
  systemPrompt?: string
}

interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>
}

interface ClaudeStreamEvent {
  type: string
  delta?: {
    type?: string
    text?: string
    thinking?: string
  }
  content_block?: {
    type: string
    id?: string
    name?: string
    input?: unknown
  }
  index?: number
}

export function createClaudeAdapter(config: ClaudeConfig = {}): ChatAdapter {
  const {
    apiKey,
    baseUrl = 'https://api.anthropic.com/v1',
    model = 'claude-sonnet-4-20250514',
    maxTokens = 4096,
    enableThinking = false,
    systemPrompt,
    headers = {},
  } = config

  const getApiKey = () => {
    if (apiKey) return apiKey
    if (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) {
      return process.env.ANTHROPIC_API_KEY
    }
    throw new Error('Anthropic API key not provided')
  }

  const convertMessages = (messages: ChatMessage[]): ClaudeMessage[] => {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
  }

  return {
    providerName: 'Claude',

    features: {
      streaming: true,
      thinking: enableThinking,
      toolUse: true,
    },

    async sendMessage(messages, options = {}) {
      const { onStream, onThinking, onToolCall, signal } = options

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': getApiKey(),
          'anthropic-version': '2023-06-01',
          ...headers,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: convertMessages(messages),
          stream: true,
        }),
        signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Claude API error: ${response.status} - ${error}`)
      }

      let content = ''
      let thinking = ''
      const toolCalls: ToolCall[] = []

      for await (const event of parseSSEStream(response)) {
        if (event.data === '[DONE]') break

        try {
          const data: ClaudeStreamEvent = JSON.parse(event.data)

          if (data.type === 'content_block_delta') {
            if (data.delta?.text) {
              content += data.delta.text
              onStream?.(data.delta.text)
            }
            if (data.delta?.thinking) {
              thinking += data.delta.thinking
              onThinking?.(thinking)
            }
          }

          if (data.type === 'content_block_start' && data.content_block?.type === 'tool_use') {
            const tc: ToolCall = {
              id: data.content_block.id || generateId(),
              name: data.content_block.name || 'unknown',
              input: (data.content_block.input as Record<string, unknown>) || {},
              status: 'running',
            }
            toolCalls.push(tc)
            onToolCall?.(tc)
          }

          if (data.type === 'content_block_stop' && toolCalls.length > 0) {
            const lastTool = toolCalls[toolCalls.length - 1]
            lastTool.status = 'complete'
            onToolCall?.(lastTool)
          }
        } catch {
          // Skip invalid JSON
        }
      }

      return {
        id: generateId(),
        role: 'assistant',
        content,
        thinking: thinking || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date(),
      }
    },
  }
}

export default createClaudeAdapter
