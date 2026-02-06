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
  index?: number
  delta?: {
    type?: string
    text?: string
    thinking?: string
    partial_json?: string
  }
  content_block?: {
    type: string
    id?: string
    name?: string
  }
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
      const toolCallArgs: Record<number, string> = {} // Track args by index
      const blockTypes: Record<number, string> = {} // Track block types by index

      for await (const event of parseSSEStream(response)) {
        if (event.data === '[DONE]') break

        try {
          const data: ClaudeStreamEvent = JSON.parse(event.data)

          // Track content block types when they start
          if (data.type === 'content_block_start' && data.index !== undefined) {
            blockTypes[data.index] = data.content_block?.type || 'text'

            // Initialize tool call when tool_use block starts
            if (data.content_block?.type === 'tool_use') {
              const tc: ToolCall = {
                id: data.content_block.id || generateId(),
                name: data.content_block.name || 'unknown',
                input: {},
                status: 'running',
              }
              toolCalls.push(tc)
              toolCallArgs[data.index] = ''
              onToolCall?.(tc)
            }
          }

          // Handle content block deltas based on delta type
          if (data.type === 'content_block_delta' && data.index !== undefined) {
            // Text content
            if (data.delta?.type === 'text_delta' && data.delta?.text) {
              content += data.delta.text
              onStream?.(data.delta.text)
            }

            // Thinking content (extended thinking feature)
            if (data.delta?.type === 'thinking_delta' && data.delta?.thinking) {
              thinking += data.delta.thinking
              onThinking?.(thinking)
            }

            // Tool use arguments (streamed as partial JSON)
            if (data.delta?.type === 'input_json_delta' && data.delta?.partial_json) {
              toolCallArgs[data.index] = (toolCallArgs[data.index] || '') + data.delta.partial_json
            }
          }

          // Finalize tool calls when block stops
          if (data.type === 'content_block_stop' && data.index !== undefined) {
            const blockType = blockTypes[data.index]
            if (blockType === 'tool_use') {
              // Find the tool call for this block and parse its arguments
              const toolIndex = Object.keys(blockTypes)
                .filter(k => blockTypes[parseInt(k)] === 'tool_use')
                .indexOf(String(data.index))

              if (toolIndex >= 0 && toolIndex < toolCalls.length) {
                const tc = toolCalls[toolIndex]
                if (toolCallArgs[data.index]) {
                  try {
                    tc.input = JSON.parse(toolCallArgs[data.index])
                  } catch {
                    tc.input = { raw: toolCallArgs[data.index] }
                  }
                }
                tc.status = 'complete'
                onToolCall?.(tc)
              }
            }
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
