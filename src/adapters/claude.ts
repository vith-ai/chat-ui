/**
 * Claude / Anthropic API Adapter
 *
 * Supports:
 * - Claude API (api.anthropic.com)
 * - Claude Agent SDK
 * - Extended thinking
 * - Tool use with automatic execution loop
 * - Streaming
 */

import type { ChatMessage, ChatAdapter, ProviderConfig, ToolCall, ToolResult, SendMessageOptions } from '../types'
import { generateId, parseSSEStream } from '../utils'

/** Tool definition for Claude API */
export interface ClaudeTool {
  /** Tool name */
  name: string
  /** Tool description */
  description: string
  /** JSON Schema for input parameters */
  input_schema: Record<string, unknown>
}

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
  /** Tool definitions for Claude to use */
  tools?: ClaudeTool[]
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
    tools,
    headers = {},
  } = config

  const getApiKey = () => {
    if (apiKey) return apiKey
    if (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY) {
      return process.env.ANTHROPIC_API_KEY
    }
    throw new Error('Anthropic API key not provided')
  }

  // Convert ChatMessage to Claude API format, handling tool results
  const convertMessages = (messages: ChatMessage[], toolResults?: ToolResult[]): ClaudeMessage[] => {
    const result: ClaudeMessage[] = []

    for (const m of messages) {
      if (m.role === 'system') continue

      // If assistant message has tool calls, format as content blocks
      if (m.role === 'assistant' && m.toolCalls?.length) {
        const contentBlocks: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }> = []
        if (m.content) {
          contentBlocks.push({ type: 'text', text: m.content })
        }
        for (const tc of m.toolCalls) {
          contentBlocks.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.input,
          })
        }
        result.push({ role: 'assistant', content: contentBlocks })
      } else {
        result.push({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })
      }
    }

    // Add tool results as a user message if provided
    if (toolResults?.length) {
      result.push({
        role: 'user',
        content: toolResults.map((tr) => ({
          type: 'tool_result',
          tool_use_id: tr.toolCallId,
          content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result),
          is_error: tr.isError,
        })) as unknown as string, // Type assertion for Claude API format
      })
    }

    return result
  }

  // Make a single API call and stream the response
  const makeRequest = async (
    claudeMessages: ClaudeMessage[],
    options: SendMessageOptions
  ): Promise<{ content: string; thinking: string; toolCalls: ToolCall[] }> => {
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
        messages: claudeMessages,
        stream: true,
        ...(tools?.length ? { tools } : {}),
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
    const toolCallArgs: Record<number, string> = {}
    const blockTypes: Record<number, string> = {}

    for await (const event of parseSSEStream(response)) {
      if (event.data === '[DONE]') break

      try {
        const data: ClaudeStreamEvent = JSON.parse(event.data)

        if (data.type === 'content_block_start' && data.index !== undefined) {
          blockTypes[data.index] = data.content_block?.type || 'text'

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

        if (data.type === 'content_block_delta' && data.index !== undefined) {
          if (data.delta?.type === 'text_delta' && data.delta?.text) {
            content += data.delta.text
            onStream?.(data.delta.text)
          }

          if (data.delta?.type === 'thinking_delta' && data.delta?.thinking) {
            thinking += data.delta.thinking
            onThinking?.(thinking)
          }

          if (data.delta?.type === 'input_json_delta' && data.delta?.partial_json) {
            toolCallArgs[data.index] = (toolCallArgs[data.index] || '') + data.delta.partial_json
          }
        }

        if (data.type === 'content_block_stop' && data.index !== undefined) {
          const blockType = blockTypes[data.index]
          if (blockType === 'tool_use') {
            const toolIndex = Object.keys(blockTypes)
              .filter((k) => blockTypes[parseInt(k)] === 'tool_use')
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

    return { content, thinking, toolCalls }
  }

  return {
    providerName: 'Claude',

    features: {
      streaming: true,
      thinking: enableThinking,
      toolUse: !!tools?.length,
    },

    async sendMessage(messages, options = {}) {
      const { toolExecutor, maxIterations = 10 } = options

      let claudeMessages = convertMessages(messages)
      let allToolCalls: ToolCall[] = []
      let finalContent = ''
      let finalThinking = ''
      let iteration = 0

      // Tool execution loop
      while (iteration < maxIterations) {
        iteration++

        const { content, thinking, toolCalls } = await makeRequest(claudeMessages, options)

        finalContent = content
        if (thinking) finalThinking = thinking
        allToolCalls = [...allToolCalls, ...toolCalls]

        // If no tool calls or no executor, we're done
        if (!toolCalls.length || !toolExecutor) {
          break
        }

        // Execute tools and collect results
        const toolResults: ToolResult[] = []
        for (const tc of toolCalls) {
          // Update status to running
          tc.status = 'running'
          options.onToolCall?.(tc)

          try {
            const result = await toolExecutor(tc)
            toolResults.push(result)
            tc.status = 'complete'
            tc.output = result.result
          } catch (error) {
            toolResults.push({
              toolCallId: tc.id,
              result: error instanceof Error ? error.message : 'Unknown error',
              isError: true,
            })
            tc.status = 'error'
            tc.error = error instanceof Error ? error.message : 'Unknown error'
          }
          options.onToolCall?.(tc)
        }

        // Add assistant message with tool calls, then tool results
        claudeMessages.push({
          role: 'assistant',
          content: [
            ...(content ? [{ type: 'text', text: content }] : []),
            ...toolCalls.map((tc) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            })),
          ] as unknown as string,
        })
        claudeMessages.push({
          role: 'user',
          content: toolResults.map((tr) => ({
            type: 'tool_result',
            tool_use_id: tr.toolCallId,
            content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result),
            is_error: tr.isError,
          })) as unknown as string,
        })
      }

      return {
        id: generateId(),
        role: 'assistant',
        content: finalContent,
        thinking: finalThinking || undefined,
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        timestamp: new Date(),
      }
    },
  }
}

export default createClaudeAdapter
