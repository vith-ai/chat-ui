/**
 * Core types for the chat UI library
 * These are model-agnostic and work with any LLM provider
 */

export type MessageRole = 'user' | 'assistant' | 'system'

export type ToolCallStatus = 'pending' | 'running' | 'complete' | 'error'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type ApprovalRisk = 'low' | 'medium' | 'high'

export interface ToolCall {
  /** Unique identifier for this tool call */
  id: string
  /** Name of the tool being called */
  name: string
  /** Input parameters passed to the tool */
  input: Record<string, unknown>
  /** Output/result from the tool (if complete) */
  output?: unknown
  /** Current status of the tool call */
  status: ToolCallStatus
  /** Error message if status is 'error' */
  error?: string
  /** Duration in milliseconds (if complete) */
  duration?: number
}

export interface ChatMessage {
  /** Unique identifier for this message */
  id: string
  /** Role of the message sender */
  role: MessageRole
  /** Text content of the message */
  content: string
  /** Tool calls made in this message (assistant only) */
  toolCalls?: ToolCall[]
  /** Extended thinking/reasoning content */
  thinking?: string
  /** Timestamp of the message */
  timestamp?: Date
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

export interface TaskItem {
  /** Unique identifier for this task */
  id: string
  /** Display label for the task */
  label: string
  /** Current status */
  status: TaskStatus
  /** Optional description */
  description?: string
  /** Active form text (shown while in progress) */
  activeForm?: string
}

export interface ApprovalRequest {
  /** Unique identifier for this approval request */
  id: string
  /** Description of the action requiring approval */
  action: string
  /** Risk level of the action */
  risk: ApprovalRisk
  /** Additional details about what will happen */
  details?: string
  /** Code or command to be executed (if applicable) */
  code?: string
}

export interface FileChange {
  /** Path to the file */
  path: string
  /** Type of change */
  type: 'created' | 'modified' | 'deleted'
  /** Original content (for modified files) */
  before?: string
  /** New content */
  after?: string
  /** Language for syntax highlighting */
  language?: string
}

export interface QuestionOption {
  /** Display label */
  label: string
  /** Optional description */
  description?: string
  /** Value to return when selected */
  value?: string
}

export interface PendingQuestion {
  /** Unique identifier */
  id: string
  /** The question text */
  question: string
  /** Available options */
  options: QuestionOption[]
  /** Optional header/category */
  header?: string
  /** Allow multiple selections */
  multiSelect?: boolean
}

// Streaming types
export interface StreamingState {
  /** Whether currently streaming */
  isStreaming: boolean
  /** Partial content being streamed */
  partialContent?: string
  /** Partial thinking being streamed */
  partialThinking?: string
}

// Theme configuration
export interface ChatTheme {
  /** Background color */
  bg?: string
  /** Surface/card color */
  surface?: string
  /** Border color */
  border?: string
  /** Primary text color */
  text?: string
  /** Secondary text color */
  textSecondary?: string
  /** Accent color */
  accent?: string
  /** Accent hover color */
  accentHover?: string
  /** Success color */
  success?: string
  /** Warning color */
  warning?: string
  /** Error color */
  error?: string
}

// Provider configuration for adapters
export interface ProviderConfig {
  /** API endpoint URL */
  baseUrl?: string
  /** API key */
  apiKey?: string
  /** Model identifier */
  model?: string
  /** Additional headers */
  headers?: Record<string, string>
  /** Request timeout in ms */
  timeout?: number
}

// Adapter interface that all providers implement
export interface ChatAdapter {
  /** Send a message and get a response */
  sendMessage(
    messages: ChatMessage[],
    options?: {
      onStream?: (chunk: string) => void
      onThinking?: (thinking: string) => void
      onToolCall?: (toolCall: ToolCall) => void
      signal?: AbortSignal
    }
  ): Promise<ChatMessage>

  /** Provider name for display */
  readonly providerName: string

  /** Supported features */
  readonly features: {
    streaming: boolean
    thinking: boolean
    toolUse: boolean
  }
}
