# @vith-ai/chat-ui - Development Guide

> **For Claude**: This file is your map for the chat-ui library. Read this FIRST before exploring.

## Quick Reference

| Task | File(s) to Edit |
|------|----------------|
| Add/modify UI components | `src/components/` |
| Add new adapter | `src/adapters/`, `tsup.config.ts`, `package.json` (exports) |
| Modify types | `src/types.ts` |
| Add hooks | `src/hooks/` |
| Artifact system | `src/artifacts.ts` |
| Permission system | `src/permissions.ts` |
| **Demo/docs landing page** | `docs/src/App.tsx` (separate Vite project) |
| Update README | `README.md` |

## Project Structure

```
@vith-ai/chat-ui/
├── src/
│   ├── adapters/           # LLM provider adapters
│   │   ├── claude.ts       # Claude/Anthropic API
│   │   ├── openai.ts       # OpenAI (and compatible APIs)
│   │   ├── bedrock.ts      # AWS Bedrock (requires @aws-sdk)
│   │   ├── ollama.ts       # Ollama (local)
│   │   ├── openrouter.ts   # OpenRouter
│   │   └── index.ts        # Re-exports
│   ├── components/         # React UI components
│   │   ├── MessageBubble.tsx
│   │   ├── ThinkingBox.tsx
│   │   ├── ToolCallCard.tsx
│   │   ├── TodoBox.tsx
│   │   ├── ApprovalCard.tsx
│   │   ├── DiffView.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── ChatContainer.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useChat.ts          # Main chat state management
│   │   └── useConversations.ts # Multi-conversation management
│   ├── artifacts.ts        # Artifact registry & helpers
│   ├── permissions.ts      # Tool permission system
│   ├── types.ts            # All TypeScript types
│   ├── utils.ts            # Utilities (generateId, parseSSEStream)
│   ├── styles.css          # Base styles (CSS variables)
│   └── index.ts            # Main exports
├── docs/                   # Demo landing page (Vercel)
│   ├── src/App.tsx         # Interactive demo
│   └── package.json        # Separate dependencies
├── dist/                   # Built output
├── README.md               # User documentation
├── package.json
├── tsup.config.ts          # Build configuration
└── tsconfig.json
```

## Adapter Architecture

Each adapter implements the `ChatAdapter` interface:

```typescript
interface ChatAdapter {
  providerName: string
  features: {
    streaming: boolean
    thinking: boolean
    toolUse: boolean
  }
  sendMessage(
    messages: ChatMessage[],
    options?: {
      onStream?: (chunk: string) => void
      onThinking?: (thinking: string) => void
      onToolCall?: (toolCall: ToolCall) => void
      signal?: AbortSignal
    }
  ): Promise<ChatMessage>
}
```

### Streaming Event Parsing

**Claude API** (`claude.ts`):
- `content_block_start` - Track block type (text, thinking, tool_use)
- `content_block_delta` - Parse by `delta.type`:
  - `text_delta` → content
  - `thinking_delta` → thinking
  - `input_json_delta` → tool arguments (partial JSON)
- `content_block_stop` - Finalize tool calls

**OpenAI API** (`openai.ts`, `openrouter.ts`):
- SSE with `choices[0].delta.content` for text
- `choices[0].delta.tool_calls` for tool calls
- `[DONE]` signals end of stream

**Bedrock** (`bedrock.ts`):
- Requires `@aws-sdk/client-bedrock-runtime`
- Server-side only (AWS credentials)
- Uses dynamic imports to make SDK optional

## Key Patterns

### Adding a New Adapter

1. Create `src/adapters/newprovider.ts`:
```typescript
import type { ChatAdapter, ProviderConfig, ToolCall } from '../types'
import { generateId, parseSSEStream } from '../utils'

export interface NewProviderConfig extends ProviderConfig {
  // Provider-specific options
}

export function createNewProviderAdapter(config: NewProviderConfig = {}): ChatAdapter {
  return {
    providerName: 'New Provider',
    features: { streaming: true, thinking: false, toolUse: true },
    async sendMessage(messages, options = {}) {
      // Implementation
    },
  }
}

export default createNewProviderAdapter
```

2. Add to `src/adapters/index.ts`
3. Add entry point in `tsup.config.ts`
4. Add exports in `package.json`
5. Update README.md with usage example

### Streaming State Flow

```
User sends message
  → useChat.sendMessage()
  → adapter.sendMessage() starts
  → onThinking() called as thinking streams → sets thinkingText state
  → onStream() called as content streams
  → onToolCall() called for tool use
  → Returns complete ChatMessage
  → Message added to messages array
  → thinkingText cleared
```

## Demo Site (docs/)

The `docs/` folder is a separate Vite project that showcases the library:

```bash
cd docs
npm install
npm run dev      # Local dev
npm run build    # Build for Vercel
npx vercel --prod  # Deploy
```

**Features demonstrated**:
- Streaming text (simulated word-by-word)
- Thinking box with expand/collapse
- Tool call cards with status
- Task lists (TodoBox)
- Approval cards
- Diff view
- Question cards
- Artifact panel (code, spreadsheet, PDF, images)

## Build & Publish

```bash
npm run build     # Build library with tsup
npm run lint      # Run ESLint
npm publish       # Publish to npm
```

## DO NOT

- Import AWS SDK statically in bedrock.ts (use dynamic imports)
- Forget to update README when adding features
- Forget to update demo site when adding new component types
- Use `process.env` directly in browser code

---

## Documentation Requirements

**CRITICAL**: When making changes to this library, you MUST update documentation:

| Change Type | Update Required |
|-------------|-----------------|
| New adapter | README.md (usage example), this file |
| New component | README.md (component list), demo site |
| New feature | README.md, demo site to showcase it |
| API change | README.md, types documentation |
| Bug fix in adapter | Note in adapter file comments |
| New hook | README.md, this file |

### Demo Site Updates

When adding new features, update `docs/src/App.tsx` to demonstrate them:
1. Add to `demoResponses` object if it's a new response type
2. Add UI component rendering in the message loop
3. Add to the welcome message list of demo commands

### README Updates

The README serves as the primary user documentation. Keep it accurate:
- All adapters with working examples
- All exported components listed
- All types documented
- Installation instructions current

**Self-check prompt**: Before ending a session where you modified code, ask yourself:
> "Would a user or future developer need to know about this change?"

If yes, update README.md and/or this CLAUDE.md.
