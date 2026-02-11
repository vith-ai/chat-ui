/**
 * AWS Bedrock Adapter
 *
 * Supports:
 * - Claude models on Bedrock
 * - Amazon Titan
 * - Llama models
 * - Mistral models
 * - Streaming via Bedrock Runtime
 *
 * IMPORTANT: This adapter requires @aws-sdk/client-bedrock-runtime
 * Install it with: npm install @aws-sdk/client-bedrock-runtime
 *
 * This adapter is designed for server-side use (Node.js) because:
 * 1. AWS credentials should not be exposed in browser code
 * 2. Bedrock uses AWS Event Stream format requiring SDK parsing
 */

import type { ChatAdapter, ProviderConfig, ToolCall } from '../types'
import { generateId } from '../utils'

export interface BedrockConfig extends ProviderConfig {
  /** AWS region (default: us-east-1) */
  region?: string
  /** Model ID (e.g., anthropic.claude-3-sonnet-20240229-v1:0) */
  model?: string
  /** AWS credentials - if not provided, uses default credential chain */
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  /** Max tokens to generate */
  maxTokens?: number
  /** System prompt */
  systemPrompt?: string
  /** Enable extended thinking (Claude models only) */
  enableThinking?: boolean
}

// Type definitions for AWS SDK (user must install @aws-sdk/client-bedrock-runtime)
interface BedrockClient {
  send(command: unknown, options?: { abortSignal?: AbortSignal }): Promise<BedrockStreamResponse>
}

interface BedrockStreamResponse {
  stream?: AsyncIterable<BedrockStreamEvent>
}

interface BedrockStreamEvent {
  chunk?: {
    bytes?: Uint8Array
  }
}

interface ClaudeStreamDelta {
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

export function createBedrockAdapter(config: BedrockConfig = {}): ChatAdapter {
  const {
    region = 'us-east-1',
    model = 'anthropic.claude-3-sonnet-20240229-v1:0',
    credentials,
    maxTokens = 4096,
    systemPrompt,
    enableThinking = false,
  } = config

  const isClaude = model.includes('anthropic.claude')
  const isTitan = model.includes('amazon.titan')

  // Lazy-load AWS SDK to avoid bundling issues
  let bedrockClient: BedrockClient | null = null

  const getClient = async (): Promise<BedrockClient> => {
    if (bedrockClient) return bedrockClient

    try {
      // Dynamic import to avoid bundling AWS SDK in browser builds
      // Using Function constructor to prevent static analysis
      const importFn = new Function('specifier', 'return import(specifier)')
      const sdk = await importFn('@aws-sdk/client-bedrock-runtime')
      const { BedrockRuntimeClient } = sdk

      const clientConfig: Record<string, unknown> = { region }
      if (credentials) {
        clientConfig.credentials = credentials
      }

      bedrockClient = new BedrockRuntimeClient(clientConfig) as unknown as BedrockClient
      return bedrockClient
    } catch {
      throw new Error(
        'AWS SDK not found. Install it with: npm install @aws-sdk/client-bedrock-runtime\n' +
          'This adapter is designed for server-side (Node.js) use only.'
      )
    }
  }

  return {
    providerName: 'AWS Bedrock',

    features: {
      streaming: true,
      thinking: isClaude && enableThinking,
      toolUse: isClaude,
    },

    async sendMessage(messages, options = {}) {
      const { onStream, onThinking, onToolCall, signal } = options

      const client = await getClient()

      // Build request body based on model type
      let body: string

      if (isClaude) {
        const claudeMessages = messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role,
            content: m.content,
          }))

        body = JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: maxTokens,
          system: systemPrompt || messages.find((m) => m.role === 'system')?.content,
          messages: claudeMessages,
        })
      } else if (isTitan) {
        const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n')
        body = JSON.stringify({
          inputText: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          textGenerationConfig: {
            maxTokenCount: maxTokens,
            temperature: 0.7,
          },
        })
      } else {
        // Llama/Mistral format
        const prompt = messages.map((m) => m.content).join('\n\n')
        body = JSON.stringify({
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          max_gen_len: maxTokens,
        })
      }

      // Dynamically import the command class
      const importFn = new Function('specifier', 'return import(specifier)')
      const sdk = await importFn('@aws-sdk/client-bedrock-runtime')
      const { InvokeModelWithResponseStreamCommand } = sdk

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: model,
        body: new TextEncoder().encode(body),
        contentType: 'application/json',
        accept: 'application/json',
      })

      // AWS SDK v3 accepts abort signal in the send options
      const response = await client.send(command, signal ? { abortSignal: signal } : undefined)

      let content = ''
      let thinking = ''
      const toolCalls: ToolCall[] = []
      const toolCallArgs: Record<number, string> = {}
      const blockTypes: Record<number, string> = {}
      const decoder = new TextDecoder()

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.chunk?.bytes) {
            const chunkText = decoder.decode(event.chunk.bytes)

            try {
              const parsed = JSON.parse(chunkText)

              if (isClaude) {
                // Handle Claude's streaming format on Bedrock
                const data = parsed as ClaudeStreamDelta

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
                    toolCallArgs[data.index] =
                      (toolCallArgs[data.index] || '') + data.delta.partial_json
                  }
                }

                if (data.type === 'content_block_stop' && data.index !== undefined) {
                  if (blockTypes[data.index] === 'tool_use') {
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
              } else if (isTitan) {
                // Titan streaming format
                if (parsed.outputText) {
                  content += parsed.outputText
                  onStream?.(parsed.outputText)
                }
              } else {
                // Llama/Mistral format
                if (parsed.generation) {
                  content += parsed.generation
                  onStream?.(parsed.generation)
                }
              }
            } catch {
              // Skip invalid JSON chunks
            }
          }
        }
      }

      return {
        id: generateId(),
        role: 'assistant',
        content,
        thinking: thinking || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: new Date(),
        metadata: {
          model,
          provider: 'bedrock',
          region,
        },
      }
    },
  }
}

export default createBedrockAdapter

/**
 * Helper to list available foundation models in Bedrock
 * Requires @aws-sdk/client-bedrock
 */
export async function listBedrockModels(region = 'us-east-1'): Promise<string[]> {
  try {
    const importFn = new Function('specifier', 'return import(specifier)')
    const sdk = await importFn('@aws-sdk/client-bedrock')
    const { BedrockClient, ListFoundationModelsCommand } = sdk

    const client = new BedrockClient({ region })
    const response = await client.send(new ListFoundationModelsCommand({}))

    return (
      response.modelSummaries?.map((m: { modelId?: string }) => m.modelId || '').filter(Boolean) ||
      []
    )
  } catch {
    throw new Error(
      'AWS SDK not found. Install it with: npm install @aws-sdk/client-bedrock\n' +
        'This function is designed for server-side (Node.js) use only.'
    )
  }
}
