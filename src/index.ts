// Components
export {
  MessageBubble,
  ThinkingBox,
  ToolCallCard,
  TodoBox,
  ApprovalCard,
  DiffView,
  QuestionCard,
  PlanCard,
  AgentStatusSpinner,
  TabBar,
  ChatContainer,
  ArtifactPanel,
} from './components'

export type {
  MessageBubbleProps,
  ThinkingBoxProps,
  ToolCallCardProps,
  TodoBoxProps,
  ApprovalCardProps,
  DiffViewProps,
  QuestionCardProps,
  PlanCardProps,
  AgentStatusSpinnerProps,
  TabBarProps,
  Tab,
  ChatContainerProps,
  EmptyStateLayout,
  ArtifactPanelProps,
} from './components'

// Types
export type {
  ChatMessage,
  MessageRole,
  ToolCall,
  ToolCallStatus,
  ToolResult,
  ToolExecutor,
  SendMessageOptions,
  TaskItem,
  TaskStatus,
  ApprovalRequest,
  ApprovalRisk,
  FileChange,
  PendingQuestion,
  QuestionOption,
  // Plan types
  PendingPlan,
  PlanStep,
  PlanResponse,
  // Tab types
  TabState,
  TabStatus,
  // Theme & config
  ChatTheme,
  ProviderConfig,
  ChatAdapter,
  StreamingState,
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

export { useTabChat } from './hooks/useTabChat'
export type { UseTabChatOptions, UseTabChatReturn } from './hooks/useTabChat'

export {
  useConversations,
  createLocalStorageStore,
  createMemoryStore,
  createApiStore,
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
export { renderMarkdown } from './utils/markdown'
