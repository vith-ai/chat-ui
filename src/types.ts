/**
 * Core types for the chat UI library
 * These are model-agnostic and work with any LLM provider
 */

import type { ReactNode } from 'react'

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
  /** Artifacts generated in this message (code, files, images, etc.) */
  artifacts?: Artifact[]
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

// ============ Conversation Management ============

export interface Conversation {
  /** Unique identifier */
  id: string
  /** Display title (auto-generated or user-set) */
  title: string
  /** Messages in this conversation */
  messages: ChatMessage[]
  /** Creation timestamp */
  createdAt: Date
  /** Last updated timestamp */
  updatedAt: Date
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

export interface ConversationStore {
  /** Get all conversations */
  list(): Promise<Conversation[]>
  /** Get a single conversation by ID */
  get(id: string): Promise<Conversation | null>
  /** Create a new conversation */
  create(title?: string): Promise<Conversation>
  /** Update a conversation */
  update(id: string, updates: Partial<Pick<Conversation, 'title' | 'messages' | 'metadata'>>): Promise<Conversation>
  /** Delete a conversation */
  delete(id: string): Promise<void>
}

// ============ Artifact System ============

export type ArtifactType = 'code' | 'markdown' | 'image' | 'html' | 'csv' | 'json' | 'pdf' | 'spreadsheet' | 'chart' | 'table' | 'document' | 'custom'

export interface Artifact {
  /** Unique identifier */
  id: string
  /** Type of artifact */
  type: ArtifactType
  /** Display title */
  title: string
  /** Raw content */
  content: string
  /** Language for code artifacts */
  language?: string
  /** MIME type */
  mimeType?: string
  /** Optional metadata */
  metadata?: Record<string, unknown>
}

export interface ArtifactRenderer {
  /** Types this renderer handles */
  types: ArtifactType[]
  /** Render the artifact */
  render: (artifact: Artifact) => ReactNode
  /** Optional: Check if this renderer can handle a specific artifact */
  canRender?: (artifact: Artifact) => boolean
}

// ============ Tool & Permission System ============

export type PermissionLevel = 'auto' | 'notify' | 'confirm' | 'deny'

export interface ToolDefinition {
  /** Unique tool name */
  name: string
  /** Human-readable description */
  description: string
  /** Permission level required */
  permission: PermissionLevel
  /** Risk level for UI display */
  risk?: ApprovalRisk
  /** JSON Schema for input parameters */
  inputSchema?: Record<string, unknown>
  /** Categories/tags for grouping */
  categories?: string[]
}

export interface ToolRegistry {
  /** All registered tools */
  tools: ToolDefinition[]
  /** Get permission level for a tool */
  getPermission(toolName: string): PermissionLevel
  /** Check if tool requires confirmation */
  requiresConfirmation(toolName: string): boolean
  /** Register a new tool */
  register(tool: ToolDefinition): void
  /** Update tool permission */
  setPermission(toolName: string, level: PermissionLevel): void
}

export interface PermissionConfig {
  /** Default permission for unregistered tools */
  defaultPermission: PermissionLevel
  /** Tool-specific overrides */
  toolPermissions?: Record<string, PermissionLevel>
  /** Category-based permissions */
  categoryPermissions?: Record<string, PermissionLevel>
  /** Callback when permission is requested */
  onPermissionRequest?: (tool: ToolDefinition, action: string) => Promise<boolean>
}
