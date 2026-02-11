# @vith-ai/chat-ui

Beautiful, model-agnostic React components for building agentic chat interfaces.

[![npm version](https://img.shields.io/npm/v/@vith-ai/chat-ui.svg)](https://www.npmjs.com/package/@vith-ai/chat-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![Chat UI Demo](https://chat-ui.vith.ai/og.png)

**[Live Demo](https://chat-ui.vith.ai)** · **[Documentation](https://chat-ui.vith.ai/docs)**

## Features

- **Model Agnostic** - Works with Claude, OpenAI, Bedrock, Ollama, OpenRouter, and any LLM
- **Agentic Patterns** - Built-in components for tool calls, thinking, tasks, approvals, and diffs
- **Conversation Management** - Hooks for managing multiple conversations with persistence
- **Artifact System** - Pluggable renderers for code, markdown, images, and custom types
- **Permission System** - Configurable approval flows for sensitive tool operations
- **Fully Themeable** - CSS variables for complete customization
- **TypeScript First** - Full type safety and great DX
- **Streaming Ready** - First-class support for streaming responses

## Installation

```bash
npm install @vith-ai/chat-ui
# or
pnpm add @vith-ai/chat-ui
# or
yarn add @vith-ai/chat-ui
```

## Quick Start

```tsx
import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'
import '@vith-ai/chat-ui/styles.css'

const adapter = createClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514',
})

function App() {
  const chat = useChat({ adapter })

  // Streaming is automatic! During processing, a live assistant message
  // is injected into messages with content, toolCalls, and thinking
  // updating in real-time. ChatContainer renders it automatically.

  return (
    <ChatContainer
      messages={chat.messages}
      isProcessing={chat.isProcessing}
      thinkingText={chat.thinkingText}
      tasks={chat.tasks}
      onSend={chat.sendMessage}
      onStop={chat.stopProcessing}
    />
  )
}
```

### How Streaming Works

The `useChat` hook automatically handles streaming by injecting a live assistant message into the `messages` array during processing:

1. On first stream chunk, a new assistant message is added to `messages`
2. As text streams in, `message.content` updates in real-time
3. Tool calls are added to `message.toolCalls` as they occur
4. Thinking content goes to `message.thinking`
5. When complete, the streaming message is replaced with the final response

You can detect a streaming message via `message.metadata?.isStreaming === true` if needed for custom styling.

## Model Adapters

Pre-built adapters for popular providers:

### Claude / Anthropic

```tsx
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

const adapter = createClaudeAdapter({
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-4-20250514',  // or claude-3-opus, claude-3-haiku
  maxTokens: 4096,
  enableThinking: true,  // Enable extended thinking (Claude only)
  systemPrompt: 'You are a helpful assistant.',
})
```

### OpenAI

```tsx
import { createOpenAIAdapter } from '@vith-ai/chat-ui/adapters/openai'

const adapter = createOpenAIAdapter({
  apiKey: 'sk-...',
  model: 'gpt-4o',
})

// Also works with Azure OpenAI
const azureAdapter = createOpenAIAdapter({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseUrl: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment',
})

// And Groq, Together, etc.
const groqAdapter = createOpenAIAdapter({
  apiKey: process.env.GROQ_API_KEY,
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.1-70b-versatile',
})
```

### AWS Bedrock

> **Note**: Requires `@aws-sdk/client-bedrock-runtime`. This adapter is designed for **server-side (Node.js) use only** - AWS credentials should not be exposed in browser code.

```bash
npm install @aws-sdk/client-bedrock-runtime
```

```tsx
import { createBedrockAdapter, listBedrockModels } from '@vith-ai/chat-ui/adapters/bedrock'

const adapter = createBedrockAdapter({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
  // Uses AWS SDK default credential chain (env vars, IAM role, etc.)
  // Or provide explicit credentials:
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  enableThinking: true,  // Enable extended thinking for Claude models
})

// Helper: List available foundation models (requires @aws-sdk/client-bedrock)
const models = await listBedrockModels('us-east-1')
```

### OpenRouter

```tsx
import { createOpenRouterAdapter } from '@vith-ai/chat-ui/adapters/openrouter'

const adapter = createOpenRouterAdapter({
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3-opus',  // Access 100+ models
})
```

### Ollama (Local)

```tsx
import { createOllamaAdapter, listOllamaModels, pullOllamaModel } from '@vith-ai/chat-ui/adapters/ollama'

const adapter = createOllamaAdapter({
  model: 'llama3',
  baseUrl: 'http://localhost:11434',  // Default Ollama URL
  numCtx: 4096,      // Context window size
  temperature: 0.7,
  keepAlive: '5m',   // Keep model in memory
})

// Helper: List available models
const models = await listOllamaModels()

// Helper: Pull a model with progress
await pullOllamaModel('llama3', undefined, (progress) => {
  console.log(`Download: ${(progress * 100).toFixed(1)}%`)
})
```

### Custom Adapter

```tsx
import type { ChatAdapter, ChatMessage } from '@vith-ai/chat-ui'

const customAdapter: ChatAdapter = {
  providerName: 'My API',
  features: {
    streaming: true,
    thinking: false,
    toolUse: true,
  },

  async sendMessage(messages, options) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: options?.signal,
    })

    // Handle streaming if needed
    if (options?.onStream) {
      const reader = response.body?.getReader()
      // ... process stream
    }

    const data = await response.json()
    return {
      id: data.id,
      role: 'assistant',
      content: data.content,
    }
  },
}
```

## Components

### ChatContainer

The main container that combines all chat elements:

```tsx
<ChatContainer
  // Required
  messages={messages}
  onSend={(message) => sendMessage(message)}

  // Optional - state
  isProcessing={isProcessing}
  thinkingText={thinkingText}
  tasks={tasks}
  pendingQuestion={pendingQuestion}

  // Optional - callbacks
  onStop={() => stopProcessing()}
  onAnswerQuestion={(answer) => answerQuestion(answer)}

  // Optional - customization
  toolRenderers={{
    'search': (toolCall) => <SearchResults {...toolCall} />,
    'run_code': (toolCall) => <CodeOutput {...toolCall} />,
  }}
  assistantAvatar={<BotIcon />}
  userAvatar={<UserIcon />}
  welcomeMessage={<WelcomeScreen />}
  placeholder="Type a message..."
  className="custom-class"

  // Optional - theming
  theme={{
    accent: '#a855f7',
    bg: '#0a0a0f',
  }}
/>
```

#### Empty State Layout

Control how the chat appears when there are no messages. Use `emptyStateLayout="top-input"` for a modern layout like ChatGPT or Claude, where the input appears at the top with welcome content centered below:

```tsx
<ChatContainer
  messages={messages}
  onSend={handleSend}

  // Empty state configuration
  emptyStateLayout="top-input"              // 'default' | 'top-input'
  emptyStatePlaceholder="Ask me anything..."  // Optional different placeholder when empty
  showInputHint={true}                       // Show "Enter to send · Shift+Enter for new line"

  // Custom welcome content (centered below input when using 'top-input')
  welcomeMessage={
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
        <MessageSquare className="w-6 h-6 text-purple-500" />
      </div>
      <h2 className="text-sm font-medium mb-1">Start a conversation</h2>
      <p className="text-xs text-gray-500 mb-4">Try a command below</p>
      <div className="flex flex-wrap justify-center gap-2">
        {['analyze', 'code', 'search'].map(cmd => (
          <button
            key={cmd}
            onClick={() => handleQuickAction(cmd)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  }
/>
```

### Individual Components

Use components individually for more control:

```tsx
import {
  MessageBubble,    // Single message display
  ThinkingBox,      // Collapsible thinking/reasoning
  ToolCallCard,     // Tool execution with status
  TodoBox,          // Task progress list
  ApprovalCard,     // Permission request UI
  DiffView,         // Code diff visualization
  QuestionCard,     // Multiple choice questions
  ArtifactPanel,    // Display artifacts (code, files, images) - works out of the box
  ChatContainer,    // Full chat UI (also exported at top level)
} from '@vith-ai/chat-ui'
```

#### Component Props

```tsx
// ThinkingBox - collapsible reasoning display
<ThinkingBox
  thinking={text}
  isStreaming={true}       // Show streaming indicator
  defaultCollapsed={false}
  label="Thinking..."      // Custom header label
/>

// ToolCallCard - tool execution display
<ToolCallCard
  toolCall={toolCall}
  icon={<CustomIcon />}
  renderInput={(input) => <CustomInput data={input} />}
  renderOutput={(output) => <CustomOutput data={output} />}
/>

// TodoBox - task list
<TodoBox
  tasks={tasks}
  title="Progress"
  showCompleted={true}
/>

// ApprovalCard - permission requests
<ApprovalCard
  request={request}
  onApprove={() => {}}
  onDeny={() => {}}
  disabled={false}
/>

// DiffView - file change display
<DiffView
  change={fileChange}
  onApprove={() => {}}
  onReject={() => {}}
  showActions={true}
  maxHeight={400}
/>

// QuestionCard - interactive questions
<QuestionCard
  question={question}
  onAnswer={(answer) => {}}  // string | string[] for multiSelect
  disabled={false}
/>
```

## Conversation Management

Manage multiple conversations with built-in persistence:

```tsx
import {
  useConversations,
  useChat,
  createLocalStorageStore,
  createMemoryStore,
} from '@vith-ai/chat-ui'

function ChatApp() {
  const conversations = useConversations({
    // Built-in stores:
    store: createLocalStorageStore('my-chats'),  // localStorage (default)
    // store: createMemoryStore(),               // In-memory (SSR/testing)
    autoTitle: true,        // Auto-generate titles from first message
    maxTitleLength: 50,
  })

  const chat = useChat({
    adapter,
    // Sync with conversation
    initialMessages: conversations.currentConversation?.messages || [],
    onResponse: () => {
      conversations.updateMessages(chat.messages)
    },
  })

  return (
    <div className="flex">
      {/* Conversation sidebar */}
      <aside>
        <button onClick={() => conversations.createConversation()}>
          New Chat
        </button>
        {conversations.conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => conversations.selectConversation(conv.id)}
          >
            {conv.title}
          </button>
        ))}
      </aside>

      {/* Chat area */}
      <ChatContainer
        messages={chat.messages}
        onSend={chat.sendMessage}
      />
    </div>
  )
}
```

### Custom Storage Backend

```tsx
import type { ConversationStore } from '@vith-ai/chat-ui'

// Example: Supabase backend
const supabaseStore: ConversationStore = {
  async list() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    return data
  },

  async get(id) {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()
    return data
  },

  async create(title) {
    const { data } = await supabase
      .from('conversations')
      .insert({ title: title || 'New conversation' })
      .select()
      .single()
    return data
  },

  async update(id, updates) {
    const { data } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return data
  },

  async delete(id) {
    await supabase.from('conversations').delete().eq('id', id)
  },
}

// Use custom store
const conversations = useConversations({ store: supabaseStore })
```

## Artifact System

Display rich content with pluggable renderers:

```tsx
import {
  ArtifactRegistry,
  createArtifact,
  detectArtifactType,
} from '@vith-ai/chat-ui'

// Create registry and register custom renderers
const registry = new ArtifactRegistry()

// Register a code renderer with syntax highlighting
// Requires: npm install shiki
registry.register({
  types: ['code'],
  render: (artifact) => (
    <SyntaxHighlighter language={artifact.language}>
      {artifact.content}
    </SyntaxHighlighter>
  ),
})

// Register markdown renderer
// Requires: npm install react-markdown
registry.register({
  types: ['markdown'],
  render: (artifact) => (
    <ReactMarkdown>{artifact.content}</ReactMarkdown>
  ),
})

// Register spreadsheet renderer
// Example with @univerjs/presets (npm install @univerjs/presets)
import { UniverSheet } from '@univerjs/presets'
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

registry.register({
  types: ['spreadsheet', 'csv'],
  render: (artifact) => (
    <UniverSheet data={parseCSV(artifact.content)} />
  ),
})

// Register image renderer
registry.register({
  types: ['image'],
  render: (artifact) => (
    <img src={artifact.content} alt={artifact.title} />
  ),
})

// Create artifacts
const codeArtifact = createArtifact(code, {
  title: 'Button.tsx',
  type: 'code',
  language: 'typescript',
})

// Auto-detect type from filename
const artifact = createArtifact(content, {
  filename: 'data.csv',  // Will detect as 'csv' type
})
```

### Bring Your Own Renderers

The library provides artifact type detection and a registry system, but **does not include renderers**. You register your own renderers using any libraries you prefer:

| Artifact Type | Recommended Libraries | Purpose |
|---------------|----------------------|---------|
| `code` | `shiki` (recommended), `prism-react-renderer` | Syntax highlighting |
| `markdown` | `react-markdown` + `remark-gfm` | Rich markdown |
| `spreadsheet`, `csv` | `@univerjs/presets`, `ag-grid-react`, or custom | Tabular data |
| `pdf` | `react-pdf` | PDF viewing |
| `image` | Native `<img>` | Image display |
| `html` | `iframe` or sanitized render | HTML content |
| `custom` | Your implementation | Anything else |

> **Note**: The [live demo](https://chat-ui.vith.ai) uses `shiki` for code highlighting and a custom spreadsheet component. See the demo source for implementation examples.

## Permission System

Configure approval flows for sensitive operations:

```tsx
import {
  createToolRegistry,
  commonTools,
  permissionPresets,
} from '@vith-ai/chat-ui'

// Create registry with common tools
const toolRegistry = createToolRegistry(commonTools)

// Or define custom tools
toolRegistry.register({
  name: 'deploy_production',
  description: 'Deploy to production servers',
  permission: 'confirm',  // 'auto' | 'notify' | 'confirm' | 'deny'
  risk: 'high',           // 'low' | 'medium' | 'high'
  categories: ['deployment'],
})

// Use permission presets
const config = {
  ...permissionPresets.standard,  // Sensible defaults
  toolPermissions: {
    'read_file': 'auto',      // No confirmation needed
    'write_file': 'confirm',  // Requires user approval
    'run_shell': 'confirm',   // Requires user approval
    'delete_file': 'deny',    // Never allow
  },
}

// In your chat handler
function handleToolCall(toolCall) {
  const permission = toolRegistry.getPermission(toolCall.name)

  if (permission === 'deny') {
    return { error: 'This action is not allowed' }
  }

  if (permission === 'confirm') {
    // Show ApprovalCard and wait for user response
    setPendingApproval({
      id: toolCall.id,
      action: toolCall.name,
      risk: toolRegistry.tools.find(t => t.name === toolCall.name)?.risk || 'medium',
      details: JSON.stringify(toolCall.input),
    })
    return // Wait for approval
  }

  // Auto or notify - execute immediately
  return executeToolCall(toolCall)
}
```

### Permission Levels

| Level | Behavior |
|-------|----------|
| `auto` | Execute immediately, no notification |
| `notify` | Execute immediately, show notification |
| `confirm` | Show ApprovalCard, wait for user approval |
| `deny` | Never execute, return error |

### Permission Presets

```tsx
import { permissionPresets } from '@vith-ai/chat-ui'

// permissionPresets.permissive - Allow everything (dev/testing)
// permissionPresets.standard - Confirm writes, auto reads
// permissionPresets.strict - Confirm everything
// permissionPresets.noExecution - Deny code/shell execution
```

## Theming

### CSS Variables

```css
:root {
  --chat-bg: #0a0a0f;
  --chat-surface: #12121a;
  --chat-surface-elevated: #1a1a24;
  --chat-border: #1e1e2e;
  --chat-text: #fafafa;
  --chat-text-secondary: #a1a1aa;
  --chat-accent: #a855f7;
  --chat-accent-hover: #9333ea;
  --chat-success: #22c55e;
  --chat-warning: #f59e0b;
  --chat-error: #ef4444;
}

/* Light theme example */
.light-theme {
  --chat-bg: #ffffff;
  --chat-surface: #f4f4f5;
  --chat-surface-elevated: #e4e4e7;
  --chat-border: #d4d4d8;
  --chat-text: #18181b;
  --chat-text-secondary: #71717a;
}
```

### Theme Prop

```tsx
<ChatContainer
  theme={{
    bg: '#ffffff',
    surface: '#f4f4f5',
    accent: '#6366f1',
  }}
/>
```

## TypeScript

Full type definitions included:

```typescript
import type {
  // Core types
  ChatMessage,
  MessageRole,
  ToolCall,
  ToolCallStatus,
  TaskItem,
  TaskStatus,

  // Approval & questions
  ApprovalRequest,
  ApprovalRisk,
  PendingQuestion,
  QuestionOption,

  // File changes
  FileChange,

  // Streaming
  StreamingState,

  // Configuration
  ChatTheme,
  ChatAdapter,
  ProviderConfig,

  // Conversations
  Conversation,
  ConversationStore,

  // Artifacts
  Artifact,
  ArtifactType,
  ArtifactRenderer,

  // Permissions
  ToolDefinition,
  ToolRegistry,
  PermissionConfig,
  PermissionLevel,

  // Hook types
  UseChatOptions,
  UseChatReturn,
  UseConversationsOptions,
  UseConversationsReturn,

  // Component props (for extending components)
  MessageBubbleProps,
  ThinkingBoxProps,
  ToolCallCardProps,
  TodoBoxProps,
  ApprovalCardProps,
  DiffViewProps,
  QuestionCardProps,
  ChatContainerProps,
  EmptyStateLayout,
} from '@vith-ai/chat-ui'
```

## Dependencies

### Required (included)

- `react` >= 18.0.0 (peer dependency)
- `react-dom` >= 18.0.0 (peer dependency)
- `clsx` - Conditional classnames
- `lucide-react` - Icons
- `diff` - Diff generation for DiffView
- `dompurify` - HTML sanitization

### Optional (install separately)

```bash
# AWS Bedrock adapter (server-side only)
npm install @aws-sdk/client-bedrock-runtime
npm install @aws-sdk/client-bedrock  # For listBedrockModels()

# Syntax highlighting (recommended)
npm install shiki

# Rich markdown
npm install react-markdown remark-gfm

# Spreadsheets (choose one)
npm install @univerjs/presets        # Full-featured Excel-like
npm install ag-grid-react ag-grid-community  # Enterprise grid

# PDF viewing
npm install react-pdf

# Diagrams
npm install mermaid
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Examples

### Next.js App Router

```tsx
// app/chat/page.tsx
'use client'

import { ChatContainer, useChat, useConversations } from '@vith-ai/chat-ui'
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'
import '@vith-ai/chat-ui/styles.css'

const adapter = createClaudeAdapter({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
})

export default function ChatPage() {
  const conversations = useConversations()
  const chat = useChat({ adapter })

  return (
    <div className="h-screen">
      <ChatContainer
        messages={chat.messages}
        isProcessing={chat.isProcessing}
        onSend={chat.sendMessage}
        onStop={chat.stopProcessing}
      />
    </div>
  )
}
```

### With Tool Use

```tsx
const chat = useChat({
  adapter,
  tools: [
    {
      name: 'search',
      description: 'Search the web',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
      },
    },
  ],
  onToolCall: async (toolCall) => {
    if (toolCall.name === 'search') {
      const results = await searchWeb(toolCall.input.query)
      return { results }
    }
  },
})
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Vith AI](https://vith.ai)

---

Built with ❤️ by [Vith AI](https://vith.ai)
