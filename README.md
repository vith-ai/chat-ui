# @vith-ai/chat-ui

Beautiful, model-agnostic React components for building agentic chat interfaces.

![Chat UI Demo](https://chat-ui.vith.ai/og.png)

## Features

- **Model Agnostic** - Works with Claude, OpenAI, Bedrock, Ollama, OpenRouter, and any LLM
- **Agentic Patterns** - Built-in components for tool calls, thinking, tasks, and approvals
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

## Components

### ChatContainer

The main container component that combines all chat UI elements.

```tsx
<ChatContainer
  messages={messages}
  isProcessing={isProcessing}
  thinkingText={thinkingText}
  tasks={tasks}
  pendingQuestion={pendingQuestion}
  onSend={(message) => sendMessage(message)}
  onStop={() => stopProcessing()}
  onAnswerQuestion={(answer) => answerQuestion(answer)}
  toolRenderers={{
    'my_tool': (toolCall) => <MyCustomToolUI toolCall={toolCall} />
  }}
/>
```

### Individual Components

Use components individually for more control:

```tsx
import {
  MessageBubble,
  ThinkingBox,
  ToolCallCard,
  TodoBox,
  ApprovalCard,
  DiffView,
  QuestionCard,
} from '@vith-ai/chat-ui'
```

## Adapters

Pre-built adapters for popular providers:

```tsx
// Claude / Anthropic
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

// OpenAI (also works with Azure OpenAI, Groq, Together)
import { createOpenAIAdapter } from '@vith-ai/chat-ui/adapters/openai'

// AWS Bedrock
import { createBedrockAdapter } from '@vith-ai/chat-ui/adapters/bedrock'

// OpenRouter (100+ models)
import { createOpenRouterAdapter } from '@vith-ai/chat-ui/adapters/openrouter'

// Ollama (local models)
import { createOllamaAdapter } from '@vith-ai/chat-ui/adapters/ollama'
```

## Theming

Customize with CSS variables:

```css
:root {
  --chat-bg: #0a0a0f;
  --chat-surface: #12121a;
  --chat-border: #1e1e2e;
  --chat-text: #fafafa;
  --chat-text-secondary: #a1a1aa;
  --chat-accent: #a855f7;
  --chat-accent-hover: #9333ea;
  --chat-success: #22c55e;
  --chat-warning: #f59e0b;
  --chat-error: #ef4444;
}
```

Or pass a theme object:

```tsx
<ChatContainer
  theme={{
    bg: '#ffffff',
    surface: '#f4f4f5',
    accent: '#6366f1',
  }}
/>
```

## Types

```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCall[]
  thinking?: string
  timestamp?: Date
}

interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: unknown
  status: 'pending' | 'running' | 'complete' | 'error'
}

interface TaskItem {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}
```

## License

MIT © [Vith AI](https://vith.ai)
