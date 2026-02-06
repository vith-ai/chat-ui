// Components
export {
  MessageBubble,
  ThinkingBox,
  ToolCallCard,
  TodoBox,
  ApprovalCard,
  DiffView,
  QuestionCard,
  ChatContainer,
} from './components'

export type {
  MessageBubbleProps,
  ThinkingBoxProps,
  ToolCallCardProps,
  TodoBoxProps,
  ApprovalCardProps,
  DiffViewProps,
  QuestionCardProps,
  ChatContainerProps,
} from './components'

// Types
export type {
  ChatMessage,
  MessageRole,
  ToolCall,
  ToolCallStatus,
  TaskItem,
  TaskStatus,
  ApprovalRequest,
  ApprovalRisk,
  FileChange,
  PendingQuestion,
  QuestionOption,
  StreamingState,
  ChatTheme,
  ProviderConfig,
  ChatAdapter,
  // Conversation management
  Conversation,
  ConversationStore,
  // Artifact system
  Artifact,
  ArtifactType,
  ArtifactRenderer,
  // Tool & permission system
  ToolDefinition,
  ToolRegistry,
  PermissionConfig,
  PermissionLevel,
} from './types'

// Hooks
export { useChat } from './hooks/useChat'
export type { UseChatOptions, UseChatReturn } from './hooks/useChat'

export {
  useConversations,
  createLocalStorageStore,
  createMemoryStore,
} from './hooks/useConversations'
export type { UseConversationsOptions, UseConversationsReturn } from './hooks/useConversations'

// Artifacts
export {
  ArtifactRegistry,
  defaultArtifactRegistry,
  detectArtifactType,
  createArtifact,
} from './artifacts'

// Permissions
export {
  createToolRegistry,
  commonTools,
  permissionPresets,
  getEffectivePermission,
  getRiskDisplay,
} from './permissions'

// Utilities
export { generateId } from './utils'
