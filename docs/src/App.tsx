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
      {/* Messages */}
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

      {/* Input */}
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

function CodeBlock({ code, language = 'tsx' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg border border-surface-border bg-[#0d0d12] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border">
        <span className="text-xs text-zinc-500 font-mono">{language}</span>
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

// Home Page - Just the chat
function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Minimal header */}
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

      {/* The chat IS the page */}
      <ChatDemo />
    </div>
  )
}

// Docs Page
function DocsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [activeSection, setActiveSection] = useState('setup')

  const sections = [
    { id: 'setup', label: 'Setup' },
    { id: 'components', label: 'Components' },
    { id: 'adapters', label: 'Model Adapters' },
    { id: 'theming', label: 'Theming' },
    { id: 'types', label: 'Types' },
  ]

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demo
          </button>
          <span className="font-mono text-sm font-semibold text-accent">Docs</span>
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
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0 p-4 border-r border-surface-border sticky top-14 h-[calc(100vh-56px)] hidden md:block">
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

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 max-w-3xl">
          {activeSection === 'setup' && <SetupSection />}
          {activeSection === 'components' && <ComponentsSection />}
          {activeSection === 'adapters' && <AdaptersSection />}
          {activeSection === 'theming' && <ThemingSection />}
          {activeSection === 'types' && <TypesSection />}
        </main>
      </div>
    </div>
  )
}

function SetupSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Setup</h1>
        <p className="text-zinc-400">Get started with @vith-ai/chat-ui in minutes.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Installation</h2>
        <CodeBlock code="npm install @vith-ai/chat-ui" language="bash" />
        <p className="text-sm text-zinc-500 mt-2">Or use pnpm, yarn, or bun.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Start</h2>
        <CodeBlock code={`import { ChatContainer, useChat } from '@vith-ai/chat-ui'
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
}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Without an Adapter</h2>
        <p className="text-zinc-400 text-sm mb-3">
          You can use the components without an adapter by managing state yourself:
        </p>
        <CodeBlock code={`import { ChatContainer } from '@vith-ai/chat-ui'
import { useState } from 'react'

function App() {
  const [messages, setMessages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSend = async (content) => {
    // Add user message
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content }])
    setIsProcessing(true)

    // Call your own API
    const response = await yourApi.chat(content)

    // Add assistant message
    setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: response }])
    setIsProcessing(false)
  }

  return (
    <ChatContainer
      messages={messages}
      isProcessing={isProcessing}
      onSend={handleSend}
    />
  )
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
        <p className="text-zinc-400">All available components and their props.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ChatContainer</h2>
        <p className="text-zinc-400 text-sm mb-3">
          The main container that combines all chat elements. Use this for a complete chat experience.
        </p>
        <CodeBlock code={`<ChatContainer
  messages={messages}           // ChatMessage[]
  isProcessing={isProcessing}   // boolean
  thinkingText={thinkingText}   // string - streaming thinking
  tasks={tasks}                 // TaskItem[]
  pendingQuestion={question}    // PendingQuestion
  onSend={(msg) => {}}          // (string) => void
  onStop={() => {}}             // () => void
  onAnswerQuestion={(ans) => {}} // (string | string[]) => void
  toolRenderers={{              // Custom tool renderers
    'my_tool': (tc) => <MyTool toolCall={tc} />
  }}
  theme={{ accent: '#6366f1' }} // ChatTheme
  placeholder="Type here..."    // string
  assistantAvatar={<MyAvatar />} // ReactNode
  welcomeMessage={<Welcome />}   // ReactNode
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Individual Components</h2>
        <p className="text-zinc-400 text-sm mb-3">
          Use components individually for more control:
        </p>
        <CodeBlock code={`import {
  MessageBubble,   // Single message
  ThinkingBox,     // Collapsible reasoning
  ToolCallCard,    // Tool call display
  TodoBox,         // Task progress
  ApprovalCard,    // Permission requests
  DiffView,        // Code diffs
  QuestionCard,    // Interactive questions
} from '@vith-ai/chat-ui'`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">MessageBubble</h2>
        <CodeBlock code={`<MessageBubble
  message={{ id: '1', role: 'assistant', content: 'Hello!' }}
  assistantAvatar={<Bot />}
  userAvatar={<User />}
  renderToolCalls={(toolCalls) => <MyToolUI calls={toolCalls} />}
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ThinkingBox</h2>
        <CodeBlock code={`<ThinkingBox
  thinking="Analyzing the data structure..."
  isStreaming={true}
  defaultCollapsed={false}
  label="Reasoning"
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ToolCallCard</h2>
        <CodeBlock code={`<ToolCallCard
  toolCall={{
    id: '1',
    name: 'search_web',
    input: { query: 'latest news' },
    output: { results: [...] },
    status: 'complete'
  }}
  icon={<Search />}
  renderInput={(input) => <CustomInput {...input} />}
  renderOutput={(output) => <CustomOutput {...output} />}
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">TodoBox</h2>
        <CodeBlock code={`<TodoBox
  tasks={[
    { id: '1', label: 'Fetch data', status: 'completed' },
    { id: '2', label: 'Process results', status: 'in_progress' },
    { id: '3', label: 'Generate report', status: 'pending' },
  ]}
  title="Progress"
  showCompleted={true}
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ApprovalCard</h2>
        <CodeBlock code={`<ApprovalCard
  request={{
    id: '1',
    action: 'Delete all files in /tmp',
    risk: 'high',
    details: 'This will permanently remove temporary files',
    code: 'rm -rf /tmp/*'
  }}
  onApprove={() => executeAction()}
  onDeny={() => cancelAction()}
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">DiffView</h2>
        <CodeBlock code={`<DiffView
  change={{
    path: 'src/app.tsx',
    type: 'modified',
    before: 'const x = 1',
    after: 'const x = 2',
    language: 'typescript'
  }}
  onApprove={() => applyChange()}
  onReject={() => rejectChange()}
  showActions={true}
/>`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">QuestionCard</h2>
        <CodeBlock code={`<QuestionCard
  question={{
    id: '1',
    question: 'Which database should we use?',
    header: 'Architecture',
    options: [
      { label: 'PostgreSQL', description: 'Relational, ACID compliant' },
      { label: 'MongoDB', description: 'Document store, flexible schema' },
    ],
    multiSelect: false
  }}
  onAnswer={(answer) => handleAnswer(answer)}
/>`} />
      </div>
    </div>
  )
}

function AdaptersSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Model Adapters</h1>
        <p className="text-zinc-400">Connect to any LLM provider with pre-built adapters.</p>
      </div>

      <div className="grid gap-4">
        <div className="p-4 rounded-lg border border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">◇</span>
            <h3 className="font-semibold">Claude / Anthropic</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Full support for Claude API including extended thinking and tool use.</p>
          <CodeBlock code={`import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

const adapter = createClaudeAdapter({
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  enableThinking: true,
  systemPrompt: 'You are a helpful assistant.',
})`} />
        </div>

        <div className="p-4 rounded-lg border border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">◈</span>
            <h3 className="font-semibold">OpenAI</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Works with OpenAI API, Azure OpenAI, and compatible APIs (Groq, Together).</p>
          <CodeBlock code={`import { createOpenAIAdapter } from '@vith-ai/chat-ui/adapters/openai'

const adapter = createOpenAIAdapter({
  apiKey: 'sk-...',
  model: 'gpt-4o',
  baseUrl: 'https://api.openai.com/v1', // or your Azure endpoint
  organization: 'org-...',
})`} />
        </div>

        <div className="p-4 rounded-lg border border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">▣</span>
            <h3 className="font-semibold">AWS Bedrock</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Claude, Titan, Llama, and Mistral on AWS Bedrock.</p>
          <CodeBlock code={`import { createBedrockAdapter } from '@vith-ai/chat-ui/adapters/bedrock'

const adapter = createBedrockAdapter({
  region: 'us-east-1',
  model: 'anthropic.claude-3-sonnet-20240229-v1:0',
  // Uses AWS credentials from environment or IAM role
})`} />
        </div>

        <div className="p-4 rounded-lg border border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⬡</span>
            <h3 className="font-semibold">OpenRouter</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Access 100+ models through a single API.</p>
          <CodeBlock code={`import { createOpenRouterAdapter } from '@vith-ai/chat-ui/adapters/openrouter'

const adapter = createOpenRouterAdapter({
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3-opus', // or 'openai/gpt-4o', 'meta-llama/llama-3-70b'
  appName: 'My App',
})`} />
        </div>

        <div className="p-4 rounded-lg border border-surface-border bg-surface-elevated">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">○</span>
            <h3 className="font-semibold">Ollama</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Run models locally with Ollama.</p>
          <CodeBlock code={`import { createOllamaAdapter, listOllamaModels } from '@vith-ai/chat-ui/adapters/ollama'

// List available models
const models = await listOllamaModels()

const adapter = createOllamaAdapter({
  baseUrl: 'http://localhost:11434',
  model: 'llama3',
  numCtx: 4096,
})`} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Custom Adapter</h2>
        <p className="text-zinc-400 text-sm mb-3">
          Implement the ChatAdapter interface for any provider:
        </p>
        <CodeBlock code={`import type { ChatAdapter, ChatMessage } from '@vith-ai/chat-ui'

const myAdapter: ChatAdapter = {
  providerName: 'My Provider',

  features: {
    streaming: true,
    thinking: false,
    toolUse: true,
  },

  async sendMessage(messages, options) {
    const { onStream, onThinking, onToolCall, signal } = options

    // Your API call here
    const response = await fetch('https://my-api.com/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
      signal,
    })

    // Return the assistant message
    return {
      id: '...',
      role: 'assistant',
      content: '...',
    }
  }
}`} />
      </div>
    </div>
  )
}

function ThemingSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Theming</h1>
        <p className="text-zinc-400">Customize the look and feel of your chat UI.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">CSS Variables</h2>
        <p className="text-zinc-400 text-sm mb-3">
          Override these CSS variables in your stylesheet:
        </p>
        <CodeBlock code={`:root {
  --chat-bg: #0a0a0f;           /* Main background */
  --chat-surface: #12121a;       /* Card/input backgrounds */
  --chat-border: #1e1e2e;        /* Border color */
  --chat-text: #fafafa;          /* Primary text */
  --chat-text-secondary: #a1a1aa; /* Secondary text */
  --chat-accent: #a855f7;        /* Accent color (buttons, highlights) */
  --chat-accent-hover: #9333ea;  /* Accent hover state */
  --chat-success: #22c55e;       /* Success/complete states */
  --chat-warning: #f59e0b;       /* Warning states */
  --chat-error: #ef4444;         /* Error states */
}`} language="css" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Light Theme Example</h2>
        <CodeBlock code={`.chat-light {
  --chat-bg: #ffffff;
  --chat-surface: #f4f4f5;
  --chat-border: #e4e4e7;
  --chat-text: #18181b;
  --chat-text-secondary: #71717a;
  --chat-accent: #7c3aed;
  --chat-accent-hover: #6d28d9;
}`} language="css" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Theme Prop</h2>
        <p className="text-zinc-400 text-sm mb-3">
          Or pass a theme object directly:
        </p>
        <CodeBlock code={`<ChatContainer
  theme={{
    bg: '#ffffff',
    surface: '#f4f4f5',
    border: '#e4e4e7',
    text: '#18181b',
    textSecondary: '#71717a',
    accent: '#6366f1',
    accentHover: '#4f46e5',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  }}
  {...otherProps}
/>`} />
      </div>
    </div>
  )
}

function TypesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Types</h1>
        <p className="text-zinc-400">TypeScript definitions for all exports.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ChatMessage</h2>
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

      <div>
        <h2 className="text-lg font-semibold mb-3">ToolCall</h2>
        <CodeBlock code={`interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: unknown
  status: 'pending' | 'running' | 'complete' | 'error'
  error?: string
  duration?: number
}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">TaskItem</h2>
        <CodeBlock code={`interface TaskItem {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed'
  description?: string
  activeForm?: string
}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ApprovalRequest</h2>
        <CodeBlock code={`interface ApprovalRequest {
  id: string
  action: string
  risk: 'low' | 'medium' | 'high'
  details?: string
  code?: string
}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">FileChange</h2>
        <CodeBlock code={`interface FileChange {
  path: string
  type: 'created' | 'modified' | 'deleted'
  before?: string
  after?: string
  language?: string
}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">PendingQuestion</h2>
        <CodeBlock code={`interface PendingQuestion {
  id: string
  question: string
  options: QuestionOption[]
  header?: string
  multiSelect?: boolean
}

interface QuestionOption {
  label: string
  description?: string
  value?: string
}`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">ChatAdapter</h2>
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
    </div>
  )
}

// Main App
export default function App() {
  const [page, setPage] = useState('home')

  return (
    <>
      {page === 'home' && <HomePage onNavigate={setPage} />}
      {page === 'docs' && <DocsPage onNavigate={setPage} />}
    </>
  )
}
