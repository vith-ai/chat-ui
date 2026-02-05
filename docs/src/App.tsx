import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle,
  Loader2,
  Send,
  Square,
  Bot,
  User,
  Wrench,
  Brain,
  ChevronDown,
  ChevronRight,
  Github,
  BookOpen,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react'
import clsx from 'clsx'

// Types
interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown>; status: 'complete' }>
  tasks?: Array<{ id: string; label: string; status: 'pending' | 'in_progress' | 'completed' }>
}

// Demo data
const demoConversation: DemoMessage[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you help me analyze this dataset and create a visualization?',
  },
  {
    id: '2',
    role: 'assistant',
    content: "I'll analyze your dataset and create a visualization. Let me start by examining the data structure.",
    thinking: "Looking at the data... I see it's a CSV with columns for date, revenue, and customer_count. I should create a line chart showing revenue trends over time.",
    toolCalls: [
      { id: 't1', name: 'read_file', input: { path: 'data.csv' }, status: 'complete' },
      { id: 't2', name: 'analyze_data', input: { columns: ['revenue', 'date'] }, status: 'complete' },
    ],
    tasks: [
      { id: 'task1', label: 'Load dataset', status: 'completed' },
      { id: 'task2', label: 'Analyze data structure', status: 'completed' },
      { id: 'task3', label: 'Generate visualization', status: 'in_progress' },
    ],
  },
]

// Components
function MessageBubble({ message }: { message: DemoMessage }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex gap-3 p-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <div
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-accent' : 'bg-surface-elevated border border-surface-border'
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={clsx(
          'flex-1 max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-accent text-white'
            : 'bg-surface-elevated border border-surface-border'
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </motion.div>
  )
}

function ThinkingBox({ thinking, isExpanded, onToggle }: { thinking: string; isExpanded: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 rounded-lg border border-surface-border bg-surface-elevated overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface/50 transition-colors"
      >
        <Brain className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium">Thinking</span>
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-surface-border"
          >
            <p className="px-3 py-2 text-xs text-zinc-400 font-mono">{thinking}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ToolCallCard({ tool }: { tool: { id: string; name: string; input: Record<string, unknown>; status: string } }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-lg border border-surface-border bg-emerald-500/5 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface/50 transition-colors"
      >
        <Wrench className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium font-mono">{tool.name}</span>
        <CheckCircle className="w-4 h-4 ml-auto text-emerald-400" />
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-surface-border bg-surface overflow-hidden"
          >
            <pre className="p-3 text-xs font-mono text-zinc-400 overflow-x-auto">
              {JSON.stringify(tool.input, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TodoBox({ tasks }: { tasks: Array<{ id: string; label: string; status: string }> }) {
  const completed = tasks.filter(t => t.status === 'completed').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 rounded-lg border border-surface-border bg-surface-elevated overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
        <span className="text-sm font-medium">Tasks</span>
        <span className="text-xs text-zinc-500">{completed}/{tasks.length}</span>
      </div>
      <div className="divide-y divide-surface-border">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 px-3 py-2">
            {task.status === 'completed' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : task.status === 'in_progress' ? (
              <Loader2 className="w-4 h-4 text-accent animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-zinc-600" />
            )}
            <span className={clsx('text-sm', task.status === 'completed' && 'text-zinc-500 line-through')}>
              {task.label}
            </span>
          </div>
        ))}
      </div>
      <div className="h-1 bg-surface">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${(completed / tasks.length) * 100}%` }}
        />
      </div>
    </motion.div>
  )
}

function ChatDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>(demoConversation)
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [thinkingExpanded, setThinkingExpanded] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const assistantMessage: DemoMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "I've processed your request. The analysis is complete and the visualization has been generated successfully!",
      toolCalls: [
        { id: 't3', name: 'generate_chart', input: { type: 'line', data: 'revenue_data' }, status: 'complete' },
      ],
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsProcessing(false)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id}>
            <MessageBubble message={message} />
            {message.thinking && (
              <ThinkingBox
                thinking={message.thinking}
                isExpanded={thinkingExpanded}
                onToggle={() => setThinkingExpanded(!thinkingExpanded)}
              />
            )}
            {message.toolCalls && (
              <div className="mx-4 mb-2 space-y-2">
                {message.toolCalls.map(tool => (
                  <ToolCallCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
            {message.tasks && <TodoBox tasks={message.tasks} />}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 px-4 py-3 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-surface-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Try sending a message..."
            className="flex-1 px-4 py-3 rounded-xl border border-surface-border bg-surface-elevated text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-colors"
          />
          {isProcessing ? (
            <button
              onClick={() => setIsProcessing(false)}
              className="p-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ code, language = 'tsx', title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg border border-surface-border bg-[#0d0d12] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border">
        <span className="text-xs text-zinc-500 font-mono">{title || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className="text-zinc-300">{code}</code>
      </pre>
    </div>
  )
}

function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="h-screen flex flex-col bg-surface">
      <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold text-accent">@vith-ai/chat-ui</span>
          <span className="text-xs text-zinc-600 hidden sm:block">Model-agnostic chat components</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('docs')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Docs
          </button>
          <a
            href="https://github.com/vith-ai/chat-ui"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </header>
      <ChatDemo />
    </div>
  )
}

function DocsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [activeSection, setActiveSection] = useState('quickstart')

  const sections = [
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'installation', label: 'Installation' },
    { id: 'adapters', label: 'Model Adapters' },
    { id: 'components', label: 'Components' },
    { id: 'hooks', label: 'Hooks' },
    { id: 'customization', label: 'Customization' },
    { id: 'theming', label: 'Theming' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'types', label: 'TypeScript' },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Demo
          </button>
          <span className="font-mono text-sm font-semibold text-accent">Documentation</span>
        </div>
        <a
          href="https://github.com/vith-ai/chat-ui"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Github className="w-4 h-4" />
        </a>
      </header>

      <div className="max-w-6xl mx-auto flex">
        <nav className="w-52 flex-shrink-0 p-4 border-r border-surface-border sticky top-14 h-[calc(100vh-56px)] hidden md:block overflow-y-auto">
          <ul className="space-y-1">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    activeSection === section.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-zinc-400 hover:text-white hover:bg-surface-elevated'
                  )}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-6 md:p-8 max-w-4xl">
          {activeSection === 'quickstart' && <QuickStartSection />}
          {activeSection === 'installation' && <InstallationSection />}
          {activeSection === 'adapters' && <AdaptersSection />}
          {activeSection === 'components' && <ComponentsSection />}
          {activeSection === 'hooks' && <HooksSection />}
          {activeSection === 'customization' && <CustomizationSection />}
          {activeSection === 'theming' && <ThemingSection />}
          {activeSection === 'recipes' && <RecipesSection />}
          {activeSection === 'types' && <TypesSection />}
        </main>
      </div>
    </div>
  )
}

function QuickStartSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Quick Start</h1>
        <p className="text-zinc-400">Get a working chat UI in under 5 minutes.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">1. Install</h2>
        <CodeBlock code="npm install @vith-ai/chat-ui" language="bash" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">2. Choose your model</h2>
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="text-lg">◇</span>
            <div>
              <div className="font-medium">Claude</div>
              <div className="text-zinc-500">Anthropic API - best for agentic tasks</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="text-lg">◈</span>
            <div>
              <div className="font-medium">OpenAI</div>
              <div className="text-zinc-500">GPT-4o, also works with Azure, Groq, Together</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="text-lg">○</span>
            <div>
              <div className="font-medium">Ollama</div>
              <div className="text-zinc-500">Run Llama, Mistral, etc. locally</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="text-lg">⬡</span>
            <div>
              <div className="font-medium">OpenRouter</div>
              <div className="text-zinc-500">100+ models via single API</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="text-lg">▣</span>
            <div>
              <div className="font-medium">AWS Bedrock</div>
              <div className="text-zinc-500">Claude, Titan, Llama on AWS</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">3. Add to your app</h2>
        <CodeBlock code={`import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'
import '@vith-ai/chat-ui/styles.css'

// Create adapter with your API key
const adapter = createClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default function Chat() {
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
}`} title="app.tsx" />
      </div>

      <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
        <p className="text-sm text-zinc-300">
          <strong className="text-accent">That's it!</strong> You have a working chat UI. Keep reading to learn about tool calls, thinking displays, custom styling, and more.
        </p>
      </div>
    </div>
  )
}

function InstallationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Installation</h1>
        <p className="text-zinc-400">Install the package and its peer dependencies.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Package Manager</h2>
        <div className="space-y-2">
          <CodeBlock code="npm install @vith-ai/chat-ui" language="bash" title="npm" />
          <CodeBlock code="pnpm add @vith-ai/chat-ui" language="bash" title="pnpm" />
          <CodeBlock code="yarn add @vith-ai/chat-ui" language="bash" title="yarn" />
          <CodeBlock code="bun add @vith-ai/chat-ui" language="bash" title="bun" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Peer Dependencies</h2>
        <p className="text-zinc-400 text-sm mb-3">Requires React 18+:</p>
        <CodeBlock code={`{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}`} language="json" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Import Styles</h2>
        <p className="text-zinc-400 text-sm mb-3">Import the CSS file in your app entry point:</p>
        <CodeBlock code={`// In your main.tsx or App.tsx
import '@vith-ai/chat-ui/styles.css'`} />
        <p className="text-zinc-500 text-sm mt-2">
          Or if using Tailwind, you can skip this and use the CSS variables directly.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Framework Setup</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Next.js (App Router)</h3>
            <CodeBlock code={`// app/chat/page.tsx
'use client'

import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

const adapter = createClaudeAdapter({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
})

export default function ChatPage() {
  const chat = useChat({ adapter })
  return <ChatContainer {...chat} onSend={chat.sendMessage} />
}`} title="app/chat/page.tsx" />
          </div>

          <div>
            <h3 className="font-medium mb-2">Vite</h3>
            <CodeBlock code={`// src/App.tsx
import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createOpenAIAdapter } from '@vith-ai/chat-ui/adapters/openai'
import '@vith-ai/chat-ui/styles.css'

const adapter = createOpenAIAdapter({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
})

export default function App() {
  const chat = useChat({ adapter })
  return <ChatContainer {...chat} onSend={chat.sendMessage} />
}`} title="src/App.tsx" />
          </div>

          <div>
            <h3 className="font-medium mb-2">Remix</h3>
            <CodeBlock code={`// app/routes/chat.tsx
import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createOllamaAdapter } from '@vith-ai/chat-ui/adapters/ollama'

const adapter = createOllamaAdapter({ model: 'llama3' })

export default function Chat() {
  const chat = useChat({ adapter })
  return <ChatContainer {...chat} onSend={chat.sendMessage} />
}`} title="app/routes/chat.tsx" />
          </div>
        </div>
      </div>
    </div>
  )
}

function AdaptersSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Model Adapters</h1>
        <p className="text-zinc-400">Pre-built adapters for popular LLM providers. Each adapter handles authentication, streaming, and response parsing.</p>
      </div>

      {/* Claude */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">◇</span>
          <h2 className="text-lg font-semibold">Claude / Anthropic</h2>
        </div>
        <p className="text-zinc-400 text-sm">Full support for Claude API including extended thinking, tool use, and streaming.</p>

        <CodeBlock code={`import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

const adapter = createClaudeAdapter({
  // Required
  apiKey: 'sk-ant-...',  // or process.env.ANTHROPIC_API_KEY

  // Optional - all have sensible defaults
  model: 'claude-sonnet-4-20250514',  // default
  baseUrl: 'https://api.anthropic.com/v1',  // for proxies
  maxTokens: 4096,
  enableThinking: true,  // show extended thinking
  systemPrompt: 'You are a helpful assistant.',
  timeout: 60000,  // ms
  headers: {},  // additional headers
})`} />

        <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-sm">
          <div className="font-medium mb-1">Supported Models</div>
          <div className="text-zinc-400 font-mono text-xs space-y-1">
            <div>claude-sonnet-4-20250514 (default)</div>
            <div>claude-opus-4-20250514</div>
            <div>claude-3-5-sonnet-20241022</div>
            <div>claude-3-5-haiku-20241022</div>
          </div>
        </div>
      </div>

      {/* OpenAI */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">◈</span>
          <h2 className="text-lg font-semibold">OpenAI</h2>
        </div>
        <p className="text-zinc-400 text-sm">Works with OpenAI, Azure OpenAI, and any OpenAI-compatible API (Groq, Together, Anyscale).</p>

        <CodeBlock code={`import { createOpenAIAdapter } from '@vith-ai/chat-ui/adapters/openai'

// Standard OpenAI
const adapter = createOpenAIAdapter({
  apiKey: 'sk-...',
  model: 'gpt-4o',  // default
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: 'You are a helpful assistant.',
})

// Azure OpenAI
const azureAdapter = createOpenAIAdapter({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseUrl: 'https://your-resource.openai.azure.com/openai/deployments/gpt-4o',
  headers: { 'api-key': process.env.AZURE_OPENAI_KEY },
})

// Groq (fast inference)
const groqAdapter = createOpenAIAdapter({
  apiKey: process.env.GROQ_API_KEY,
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.1-70b-versatile',
})

// Together AI
const togetherAdapter = createOpenAIAdapter({
  apiKey: process.env.TOGETHER_API_KEY,
  baseUrl: 'https://api.together.xyz/v1',
  model: 'meta-llama/Llama-3-70b-chat-hf',
})`} />
      </div>

      {/* Bedrock */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">▣</span>
          <h2 className="text-lg font-semibold">AWS Bedrock</h2>
        </div>
        <p className="text-zinc-400 text-sm">Access Claude, Titan, Llama, and Mistral models on AWS infrastructure.</p>

        <CodeBlock code={`import { createBedrockAdapter } from '@vith-ai/chat-ui/adapters/bedrock'

const adapter = createBedrockAdapter({
  region: 'us-east-1',  // default
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',

  // Credentials (optional - uses AWS SDK credential chain by default)
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,  // for temp credentials

  maxTokens: 4096,
  systemPrompt: 'You are a helpful assistant.',
})`} />

        <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-sm">
          <div className="font-medium mb-1">Supported Models</div>
          <div className="text-zinc-400 font-mono text-xs space-y-1">
            <div>anthropic.claude-3-sonnet-20240229-v1:0</div>
            <div>anthropic.claude-3-haiku-20240307-v1:0</div>
            <div>amazon.titan-text-express-v1</div>
            <div>meta.llama3-70b-instruct-v1:0</div>
            <div>mistral.mistral-large-2402-v1:0</div>
          </div>
        </div>
      </div>

      {/* OpenRouter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⬡</span>
          <h2 className="text-lg font-semibold">OpenRouter</h2>
        </div>
        <p className="text-zinc-400 text-sm">Single API for 100+ models. Great for comparing models or accessing hard-to-get models.</p>

        <CodeBlock code={`import { createOpenRouterAdapter } from '@vith-ai/chat-ui/adapters/openrouter'

const adapter = createOpenRouterAdapter({
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3-opus',  // format: provider/model

  // Optional
  appName: 'My App',  // shown in OpenRouter dashboard
  siteUrl: 'https://myapp.com',  // for rankings
  maxTokens: 4096,
  temperature: 0.7,
})`} />

        <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-sm">
          <div className="font-medium mb-1">Popular Models</div>
          <div className="text-zinc-400 font-mono text-xs space-y-1">
            <div>anthropic/claude-3-opus</div>
            <div>openai/gpt-4o</div>
            <div>meta-llama/llama-3-70b-instruct</div>
            <div>mistralai/mistral-large</div>
            <div>google/gemini-pro-1.5</div>
          </div>
        </div>
      </div>

      {/* Ollama */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">○</span>
          <h2 className="text-lg font-semibold">Ollama</h2>
        </div>
        <p className="text-zinc-400 text-sm">Run models locally. No API key needed, works offline.</p>

        <CodeBlock code={`import {
  createOllamaAdapter,
  listOllamaModels,
  pullOllamaModel
} from '@vith-ai/chat-ui/adapters/ollama'

// List installed models
const models = await listOllamaModels()
// => ['llama3', 'mistral', 'codellama']

// Pull a new model (with progress)
await pullOllamaModel('llama3', 'http://localhost:11434', (progress) => {
  console.log(\`Downloading: \${Math.round(progress * 100)}%\`)
})

// Create adapter
const adapter = createOllamaAdapter({
  baseUrl: 'http://localhost:11434',  // default
  model: 'llama3',
  numCtx: 4096,  // context window
  temperature: 0.7,
  keepAlive: '5m',  // keep model loaded
  systemPrompt: 'You are a helpful assistant.',
})`} />
      </div>

      {/* Custom Adapter */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Adapter</h2>
        <p className="text-zinc-400 text-sm">Implement the ChatAdapter interface for any provider:</p>

        <CodeBlock code={`import type { ChatAdapter, ChatMessage, ToolCall } from '@vith-ai/chat-ui'

export function createMyAdapter(config: MyConfig): ChatAdapter {
  return {
    providerName: 'My Provider',

    features: {
      streaming: true,
      thinking: false,  // set true if your API supports reasoning
      toolUse: true,
    },

    async sendMessage(messages, options = {}) {
      const { onStream, onThinking, onToolCall, signal } = options

      const response = await fetch('https://api.myprovider.com/chat', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.apiKey}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal,  // for cancellation
      })

      // Handle streaming
      const reader = response.body?.getReader()
      let content = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        content += chunk
        onStream?.(chunk)  // emit each chunk
      }

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      }
    }
  }
}`} />
      </div>
    </div>
  )
}

function ComponentsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Components</h1>
        <p className="text-zinc-400">All components with their props and configuration options.</p>
      </div>

      {/* ChatContainer */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ChatContainer</h2>
        <p className="text-zinc-400 text-sm">The main container component. Use this for a complete chat experience.</p>

        <CodeBlock code={`import { ChatContainer } from '@vith-ai/chat-ui'

<ChatContainer
  // Core props
  messages={messages}              // ChatMessage[] - required
  isProcessing={false}             // boolean - show loading state
  onSend={(msg) => {}}             // (string) => void - handle new messages
  onStop={() => {}}                // () => void - handle stop button

  // Agentic features
  thinkingText=""                  // string - streaming thinking content
  tasks={[]}                       // TaskItem[] - task progress
  pendingQuestion={null}           // PendingQuestion - interactive questions
  onAnswerQuestion={(ans) => {}}   // (string | string[]) => void

  // Customization
  toolRenderers={{                 // Custom renderers for specific tools
    'search': (tc) => <SearchResult {...tc} />,
    'code': (tc) => <CodeEditor {...tc} />,
  }}
  assistantAvatar={<Bot />}        // ReactNode - custom avatar
  userAvatar={<User />}            // ReactNode - custom avatar
  welcomeMessage={<Welcome />}     // ReactNode - shown when no messages
  placeholder="Type here..."       // string - input placeholder

  // Theming
  theme={{                         // ChatTheme - override colors
    accent: '#6366f1',
    bg: '#0a0a0f',
  }}
  className="my-chat"              // string - additional classes
/>`} />
      </div>

      {/* MessageBubble */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">MessageBubble</h2>
        <p className="text-zinc-400 text-sm">Individual message display with markdown support.</p>

        <CodeBlock code={`import { MessageBubble } from '@vith-ai/chat-ui'

<MessageBubble
  message={{
    id: '1',
    role: 'assistant',  // 'user' | 'assistant' | 'system'
    content: 'Hello! How can I help?',
    toolCalls: [...],   // optional
    thinking: '...',    // optional
  }}
  assistantAvatar={<CustomAvatar />}  // optional
  userAvatar={<CustomAvatar />}       // optional
  renderToolCalls={(calls) => (       // optional - custom tool rendering
    <div>{calls.map(c => <MyTool key={c.id} {...c} />)}</div>
  )}
  className="my-message"              // optional
/>`} />
      </div>

      {/* ThinkingBox */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ThinkingBox</h2>
        <p className="text-zinc-400 text-sm">Collapsible display for model reasoning/thinking.</p>

        <CodeBlock code={`import { ThinkingBox } from '@vith-ai/chat-ui'

<ThinkingBox
  thinking="Let me analyze this step by step..."  // string - required
  isStreaming={true}       // boolean - show typing indicator
  defaultCollapsed={false} // boolean - initial state
  label="Reasoning"        // string - header text
  className=""             // string
/>`} />
      </div>

      {/* ToolCallCard */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ToolCallCard</h2>
        <p className="text-zinc-400 text-sm">Display tool/function calls with expandable details.</p>

        <CodeBlock code={`import { ToolCallCard } from '@vith-ai/chat-ui'

<ToolCallCard
  toolCall={{
    id: '1',
    name: 'search_web',
    input: { query: 'latest news' },
    output: { results: [...] },      // optional
    status: 'complete',              // 'pending' | 'running' | 'complete' | 'error'
    error: 'Something went wrong',   // optional - shown if status is 'error'
    duration: 1234,                  // optional - ms
  }}
  icon={<SearchIcon />}              // optional - custom icon
  renderInput={(input) => <Pre>{JSON.stringify(input)}</Pre>}   // optional
  renderOutput={(output) => <ResultsView data={output} />}      // optional
  className=""
/>`} />
      </div>

      {/* TodoBox */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">TodoBox</h2>
        <p className="text-zinc-400 text-sm">Task progress display with status indicators.</p>

        <CodeBlock code={`import { TodoBox } from '@vith-ai/chat-ui'

<TodoBox
  tasks={[
    { id: '1', label: 'Fetch data', status: 'completed' },
    { id: '2', label: 'Process', status: 'in_progress', activeForm: 'Processing...' },
    { id: '3', label: 'Generate report', status: 'pending', description: 'Create PDF' },
  ]}
  title="Progress"        // string - header text
  showCompleted={true}    // boolean - show/hide completed tasks
  className=""
/>`} />
      </div>

      {/* ApprovalCard */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ApprovalCard</h2>
        <p className="text-zinc-400 text-sm">Permission request UI for dangerous operations.</p>

        <CodeBlock code={`import { ApprovalCard } from '@vith-ai/chat-ui'

<ApprovalCard
  request={{
    id: '1',
    action: 'Delete all files in /tmp',
    risk: 'high',                    // 'low' | 'medium' | 'high'
    details: 'This cannot be undone',
    code: 'rm -rf /tmp/*',           // optional - show command
  }}
  onApprove={() => executeAction()}
  onDeny={() => cancelAction()}
  disabled={false}                   // boolean
  className=""
/>`} />
      </div>

      {/* DiffView */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">DiffView</h2>
        <p className="text-zinc-400 text-sm">Code diff display with approve/reject actions.</p>

        <CodeBlock code={`import { DiffView } from '@vith-ai/chat-ui'

<DiffView
  change={{
    path: 'src/app.tsx',
    type: 'modified',               // 'created' | 'modified' | 'deleted'
    before: 'const x = 1',          // optional for 'created'
    after: 'const x = 2',
    language: 'typescript',         // optional - for syntax hints
  }}
  onApprove={() => applyChange()}   // optional
  onReject={() => rejectChange()}   // optional
  showActions={true}                // boolean - show buttons
  disabled={false}
  maxHeight={400}                   // number - px
  className=""
/>`} />
      </div>

      {/* QuestionCard */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">QuestionCard</h2>
        <p className="text-zinc-400 text-sm">Interactive question UI with options.</p>

        <CodeBlock code={`import { QuestionCard } from '@vith-ai/chat-ui'

<QuestionCard
  question={{
    id: '1',
    question: 'Which database should we use?',
    header: 'Architecture',          // optional - category label
    options: [
      { label: 'PostgreSQL', description: 'Relational, ACID', value: 'postgres' },
      { label: 'MongoDB', description: 'Document store', value: 'mongo' },
      { label: 'Redis', description: 'In-memory cache', value: 'redis' },
    ],
    multiSelect: false,              // boolean - allow multiple selections
  }}
  onAnswer={(answer) => {            // string | string[]
    console.log('Selected:', answer)
  }}
  disabled={false}
  className=""
/>`} />
      </div>
    </div>
  )
}

function HooksSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Hooks</h1>
        <p className="text-zinc-400">React hooks for managing chat state.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">useChat</h2>
        <p className="text-zinc-400 text-sm">Main hook for chat state management. Handles messages, streaming, and adapter communication.</p>

        <CodeBlock code={`import { useChat } from '@vith-ai/chat-ui'

const {
  // State
  messages,           // ChatMessage[] - all messages
  isProcessing,       // boolean - currently waiting for response
  thinkingText,       // string - streaming thinking content
  tasks,              // TaskItem[] - current tasks
  pendingQuestion,    // PendingQuestion | null - question awaiting answer

  // Actions
  sendMessage,        // (content: string) => Promise<void>
  stopProcessing,     // () => void - abort current request
  answerQuestion,     // (answer: string | string[]) => void
  addMessage,         // (message: ChatMessage) => void - add manually
  setTasks,           // (tasks: TaskItem[]) => void
  setPendingQuestion, // (question: PendingQuestion | null) => void
  clearMessages,      // () => void - reset conversation
} = useChat({
  // Options
  adapter,            // ChatAdapter - required for API calls
  initialMessages,    // ChatMessage[] - pre-populate
  onSend,             // (message: ChatMessage) => void - callback
  onResponse,         // (message: ChatMessage) => void - callback
  onError,            // (error: Error) => void - callback
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Using without an adapter</h2>
        <p className="text-zinc-400 text-sm">If you want full control over API calls, skip the adapter:</p>

        <CodeBlock code={`import { useChat } from '@vith-ai/chat-ui'

function Chat() {
  const chat = useChat()  // no adapter

  const handleSend = async (content: string) => {
    // Add user message
    chat.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    })

    // Your custom API call
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: content }),
    })

    const data = await response.json()

    // Add assistant message
    chat.addMessage({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: data.response,
      timestamp: new Date(),
    })
  }

  return (
    <ChatContainer
      messages={chat.messages}
      onSend={handleSend}
    />
  )
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Streaming with manual control</h2>

        <CodeBlock code={`import { useChat, generateId } from '@vith-ai/chat-ui'
import { useState } from 'react'

function Chat() {
  const chat = useChat()
  const [streamingContent, setStreamingContent] = useState('')

  const handleSend = async (content: string) => {
    chat.addMessage({ id: generateId(), role: 'user', content })

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      body: JSON.stringify({ message: content }),
    })

    const reader = response.body?.getReader()
    let fullContent = ''

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = new TextDecoder().decode(value)
      fullContent += chunk
      setStreamingContent(fullContent)  // update UI
    }

    // Finalize
    chat.addMessage({ id: generateId(), role: 'assistant', content: fullContent })
    setStreamingContent('')
  }

  return (
    <ChatContainer
      messages={chat.messages}
      onSend={handleSend}
      // Show streaming content as partial message
      thinkingText={streamingContent}
      isProcessing={!!streamingContent}
    />
  )
}`} />
      </div>
    </div>
  )
}

function CustomizationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Customization</h1>
        <p className="text-zinc-400">Customize avatars, tool renderers, and component behavior.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Avatars</h2>

        <CodeBlock code={`import { ChatContainer } from '@vith-ai/chat-ui'
import { Bot, User } from 'lucide-react'

// Simple icons
<ChatContainer
  assistantAvatar={<Bot className="w-5 h-5 text-purple-400" />}
  userAvatar={<User className="w-5 h-5 text-white" />}
  {...props}
/>

// Images
<ChatContainer
  assistantAvatar={<img src="/bot.png" className="w-full h-full rounded-full" />}
  userAvatar={<img src={user.avatar} className="w-full h-full rounded-full" />}
  {...props}
/>

// Dynamic based on message
function MyChat() {
  const [currentModel, setCurrentModel] = useState('claude')

  const avatars = {
    claude: <span>◇</span>,
    gpt: <span>◈</span>,
    llama: <span>○</span>,
  }

  return (
    <ChatContainer
      assistantAvatar={avatars[currentModel]}
      {...props}
    />
  )
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Tool Renderers</h2>
        <p className="text-zinc-400 text-sm">Replace the default tool call display with custom components:</p>

        <CodeBlock code={`import { ChatContainer, ToolCall } from '@vith-ai/chat-ui'

// Custom renderer for search results
function SearchResults({ toolCall }: { toolCall: ToolCall }) {
  const results = toolCall.output as { title: string; url: string }[]

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded-lg">
      <div className="text-xs text-zinc-500">Search: {toolCall.input.query}</div>
      {results?.map((r, i) => (
        <a key={i} href={r.url} className="block text-sm text-blue-400 hover:underline">
          {r.title}
        </a>
      ))}
    </div>
  )
}

// Custom renderer for code execution
function CodeExecution({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="font-mono text-sm">
      <div className="bg-zinc-900 p-3 rounded-t-lg">
        <pre>{toolCall.input.code}</pre>
      </div>
      {toolCall.output && (
        <div className="bg-zinc-800 p-3 rounded-b-lg border-t border-zinc-700">
          <pre className="text-green-400">{toolCall.output}</pre>
        </div>
      )}
    </div>
  )
}

// Use in ChatContainer
<ChatContainer
  toolRenderers={{
    'search_web': (tc) => <SearchResults toolCall={tc} />,
    'run_code': (tc) => <CodeExecution toolCall={tc} />,
    'read_file': (tc) => <FilePreview toolCall={tc} />,
    // ... other tools use default renderer
  }}
  {...props}
/>`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Welcome Screen</h2>

        <CodeBlock code={`import { ChatContainer } from '@vith-ai/chat-ui'

function WelcomeScreen() {
  return (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold">Welcome!</h2>
      <p className="text-zinc-400">How can I help you today?</p>
      <div className="flex gap-2 justify-center">
        <button className="px-3 py-1 bg-zinc-800 rounded-lg text-sm">
          Analyze data
        </button>
        <button className="px-3 py-1 bg-zinc-800 rounded-lg text-sm">
          Write code
        </button>
      </div>
    </div>
  )
}

<ChatContainer
  welcomeMessage={<WelcomeScreen />}
  {...props}
/>`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Input Placeholder</h2>

        <CodeBlock code={`// Simple text
<ChatContainer placeholder="Ask me anything..." {...props} />

// Dynamic based on context
<ChatContainer
  placeholder={
    selectedFile
      ? \`Ask about \${selectedFile.name}...\`
      : 'Select a file or ask a question...'
  }
  {...props}
/>`} />
      </div>
    </div>
  )
}

function ThemingSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Theming</h1>
        <p className="text-zinc-400">Customize colors with CSS variables or the theme prop.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">CSS Variables</h2>
        <p className="text-zinc-400 text-sm">Override in your stylesheet for global theming:</p>

        <CodeBlock code={`:root {
  /* Backgrounds */
  --chat-bg: #0a0a0f;              /* Main background */
  --chat-surface: #12121a;          /* Cards, inputs */
  --chat-border: #1e1e2e;           /* Borders */

  /* Text */
  --chat-text: #fafafa;             /* Primary text */
  --chat-text-secondary: #a1a1aa;   /* Secondary text */

  /* Accent */
  --chat-accent: #a855f7;           /* Buttons, highlights */
  --chat-accent-hover: #9333ea;     /* Hover state */

  /* Status */
  --chat-success: #22c55e;          /* Complete, success */
  --chat-warning: #f59e0b;          /* Warning */
  --chat-error: #ef4444;            /* Error, danger */
}`} language="css" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Light Theme</h2>

        <CodeBlock code={`/* Add to your CSS */
.chat-light {
  --chat-bg: #ffffff;
  --chat-surface: #f4f4f5;
  --chat-border: #e4e4e7;
  --chat-text: #18181b;
  --chat-text-secondary: #71717a;
  --chat-accent: #7c3aed;
  --chat-accent-hover: #6d28d9;
}

/* Usage */
<div className="chat-light">
  <ChatContainer {...props} />
</div>`} language="css" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Theme Prop</h2>
        <p className="text-zinc-400 text-sm">Override colors inline for component-level theming:</p>

        <CodeBlock code={`<ChatContainer
  theme={{
    bg: '#ffffff',
    surface: '#f4f4f5',
    border: '#e4e4e7',
    text: '#18181b',
    textSecondary: '#71717a',
    accent: '#6366f1',        // Indigo instead of purple
    accentHover: '#4f46e5',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  }}
  {...props}
/>`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Brand Colors</h2>
        <p className="text-zinc-400 text-sm">Match your brand:</p>

        <CodeBlock code={`// Blue theme
const blueTheme = {
  accent: '#3b82f6',
  accentHover: '#2563eb',
}

// Green theme
const greenTheme = {
  accent: '#22c55e',
  accentHover: '#16a34a',
}

// Custom brand
const brandTheme = {
  accent: '#ff6b35',      // Your brand orange
  accentHover: '#e85a2a',
}

<ChatContainer theme={brandTheme} {...props} />`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dark/Light Mode Toggle</h2>

        <CodeBlock code={`import { useState } from 'react'

function Chat() {
  const [isDark, setIsDark] = useState(true)

  const lightTheme = {
    bg: '#ffffff',
    surface: '#f4f4f5',
    border: '#e4e4e7',
    text: '#18181b',
    textSecondary: '#71717a',
  }

  const darkTheme = {
    bg: '#0a0a0f',
    surface: '#12121a',
    border: '#1e1e2e',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
  }

  return (
    <>
      <button onClick={() => setIsDark(!isDark)}>
        Toggle {isDark ? 'Light' : 'Dark'}
      </button>
      <ChatContainer
        theme={isDark ? darkTheme : lightTheme}
        {...props}
      />
    </>
  )
}`} />
      </div>
    </div>
  )
}

function RecipesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Recipes</h1>
        <p className="text-zinc-400">Common patterns and integrations.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Persisting Conversations</h2>

        <CodeBlock code={`import { useChat } from '@vith-ai/chat-ui'
import { useEffect } from 'react'

function Chat() {
  const chat = useChat({ adapter })

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat-messages')
    if (saved) {
      const messages = JSON.parse(saved)
      messages.forEach(m => chat.addMessage(m))
    }
  }, [])

  // Save on change
  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(chat.messages))
  }, [chat.messages])

  return <ChatContainer {...chat} onSend={chat.sendMessage} />
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Multiple Conversations</h2>

        <CodeBlock code={`import { useState } from 'react'
import { ChatContainer, useChat, ChatMessage } from '@vith-ai/chat-ui'

function MultiChat() {
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    default: [],
  })
  const [activeId, setActiveId] = useState('default')
  const chat = useChat({ adapter, initialMessages: conversations[activeId] })

  const createNew = () => {
    const id = crypto.randomUUID()
    setConversations(prev => ({ ...prev, [id]: [] }))
    setActiveId(id)
    chat.clearMessages()
  }

  const switchTo = (id: string) => {
    // Save current
    setConversations(prev => ({ ...prev, [activeId]: chat.messages }))
    // Load new
    setActiveId(id)
    chat.clearMessages()
    conversations[id]?.forEach(m => chat.addMessage(m))
  }

  return (
    <div className="flex">
      <div className="w-48 border-r">
        <button onClick={createNew}>New Chat</button>
        {Object.keys(conversations).map(id => (
          <button key={id} onClick={() => switchTo(id)}>
            {id.slice(0, 8)}
          </button>
        ))}
      </div>
      <ChatContainer {...chat} onSend={chat.sendMessage} />
    </div>
  )
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">System Prompt from Context</h2>

        <CodeBlock code={`import { useMemo } from 'react'

function CodeAssistant({ files, selectedFile }) {
  // Build context-aware system prompt
  const systemPrompt = useMemo(() => {
    let prompt = 'You are a code assistant. '

    if (selectedFile) {
      prompt += \`The user is viewing \${selectedFile.path}. \`
    }

    if (files.length > 0) {
      prompt += \`Available files: \${files.map(f => f.name).join(', ')}. \`
    }

    return prompt
  }, [files, selectedFile])

  // Create adapter with dynamic prompt
  const adapter = useMemo(() =>
    createClaudeAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY,
      systemPrompt,
    }),
    [systemPrompt]
  )

  const chat = useChat({ adapter })

  return <ChatContainer {...chat} onSend={chat.sendMessage} />
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">File Uploads</h2>

        <CodeBlock code={`function ChatWithFiles() {
  const chat = useChat({ adapter })
  const [files, setFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selected])
  }

  const handleSend = async (content: string) => {
    // Include file contents in message
    let fullContent = content

    for (const file of files) {
      const text = await file.text()
      fullContent += \`\\n\\nFile: \${file.name}\\n\\\`\\\`\\\`\\n\${text}\\n\\\`\\\`\\\`\`
    }

    await chat.sendMessage(fullContent)
    setFiles([])  // Clear after sending
  }

  return (
    <div>
      <input type="file" multiple onChange={handleFileSelect} />
      {files.map(f => <div key={f.name}>{f.name}</div>)}
      <ChatContainer {...chat} onSend={handleSend} />
    </div>
  )
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>

        <CodeBlock code={`import { useEffect, useRef } from 'react'

function ChatWithShortcuts() {
  const chat = useChat({ adapter })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // Escape to stop processing
      if (e.key === 'Escape' && chat.isProcessing) {
        chat.stopProcessing()
      }

      // Cmd/Ctrl + Shift + Backspace to clear
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Backspace') {
        chat.clearMessages()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chat])

  return <ChatContainer {...chat} onSend={chat.sendMessage} />
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Error Handling</h2>

        <CodeBlock code={`import { useState } from 'react'

function RobustChat() {
  const [error, setError] = useState<string | null>(null)

  const chat = useChat({
    adapter,
    onError: (err) => {
      console.error('Chat error:', err)

      // User-friendly messages
      if (err.message.includes('401')) {
        setError('Invalid API key. Please check your configuration.')
      } else if (err.message.includes('429')) {
        setError('Rate limited. Please wait a moment.')
      } else if (err.message.includes('network')) {
        setError('Network error. Check your connection.')
      } else {
        setError('Something went wrong. Please try again.')
      }

      // Auto-clear after 5s
      setTimeout(() => setError(null), 5000)
    },
  })

  return (
    <div>
      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      <ChatContainer {...chat} onSend={chat.sendMessage} />
    </div>
  )
}`} />
      </div>
    </div>
  )
}

function TypesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">TypeScript</h1>
        <p className="text-zinc-400">All type definitions for full type safety.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ChatMessage</h2>
        <CodeBlock code={`interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCall[]
  thinking?: string
  timestamp?: Date
  metadata?: Record<string, unknown>
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ToolCall</h2>
        <CodeBlock code={`type ToolCallStatus = 'pending' | 'running' | 'complete' | 'error'

interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: unknown
  status: ToolCallStatus
  error?: string
  duration?: number  // milliseconds
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">TaskItem</h2>
        <CodeBlock code={`type TaskStatus = 'pending' | 'in_progress' | 'completed'

interface TaskItem {
  id: string
  label: string
  status: TaskStatus
  description?: string
  activeForm?: string  // shown while in_progress
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ApprovalRequest</h2>
        <CodeBlock code={`type ApprovalRisk = 'low' | 'medium' | 'high'

interface ApprovalRequest {
  id: string
  action: string
  risk: ApprovalRisk
  details?: string
  code?: string
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">FileChange</h2>
        <CodeBlock code={`interface FileChange {
  path: string
  type: 'created' | 'modified' | 'deleted'
  before?: string
  after?: string
  language?: string
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">PendingQuestion</h2>
        <CodeBlock code={`interface QuestionOption {
  label: string
  description?: string
  value?: string  // defaults to label if not set
}

interface PendingQuestion {
  id: string
  question: string
  options: QuestionOption[]
  header?: string
  multiSelect?: boolean
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ChatTheme</h2>
        <CodeBlock code={`interface ChatTheme {
  bg?: string
  surface?: string
  border?: string
  text?: string
  textSecondary?: string
  accent?: string
  accentHover?: string
  success?: string
  warning?: string
  error?: string
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ChatAdapter</h2>
        <CodeBlock code={`interface ChatAdapter {
  readonly providerName: string

  readonly features: {
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
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ProviderConfig</h2>
        <CodeBlock code={`interface ProviderConfig {
  baseUrl?: string
  apiKey?: string
  model?: string
  headers?: Record<string, string>
  timeout?: number  // milliseconds
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Importing Types</h2>
        <CodeBlock code={`import type {
  ChatMessage,
  ToolCall,
  ToolCallStatus,
  TaskItem,
  TaskStatus,
  ApprovalRequest,
  ApprovalRisk,
  FileChange,
  PendingQuestion,
  QuestionOption,
  ChatTheme,
  ChatAdapter,
  ProviderConfig,
} from '@vith-ai/chat-ui'`} />
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home')

  return (
    <>
      {page === 'home' && <HomePage onNavigate={setPage} />}
      {page === 'docs' && <DocsPage onNavigate={setPage} />}
    </>
  )
}
