import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  MessageSquare,
  Cpu,
  Zap,
  Code2,
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
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Box,
  Layers,
  Palette,
  Terminal,
} from 'lucide-react'
import clsx from 'clsx'

// Simulated chat data for the demo
const demoConversation = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Can you help me analyze this dataset and create a visualization?',
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: "I'll analyze your dataset and create a visualization. Let me start by examining the data structure.",
    thinking: "Looking at the data... I see it's a CSV with columns for date, revenue, and customer_count. I should create a line chart showing revenue trends over time.",
    toolCalls: [
      { id: 't1', name: 'read_file', input: { path: 'data.csv' }, status: 'complete' as const },
      { id: 't2', name: 'analyze_data', input: { columns: ['revenue', 'date'] }, status: 'complete' as const },
    ],
    tasks: [
      { id: 'task1', label: 'Load dataset', status: 'completed' as const },
      { id: 'task2', label: 'Analyze data structure', status: 'completed' as const },
      { id: 'task3', label: 'Generate visualization', status: 'in_progress' as const },
    ],
  },
]

const providers = [
  { name: 'Claude', logo: '◇' },
  { name: 'OpenAI', logo: '◈' },
  { name: 'Bedrock', logo: '▣' },
  { name: 'Ollama', logo: '○' },
  { name: 'OpenRouter', logo: '⬡' },
]

const features = [
  {
    icon: Box,
    title: 'Model Agnostic',
    description: 'Works with any LLM provider. Claude, GPT-4, Llama, Mistral — use one interface for all.',
  },
  {
    icon: Wrench,
    title: 'Tool Call Visualization',
    description: 'Beautiful UI for function calls, tool results, and agentic workflows.',
  },
  {
    icon: Brain,
    title: 'Thinking Display',
    description: 'Show reasoning and chain-of-thought with collapsible thinking blocks.',
  },
  {
    icon: Layers,
    title: 'Task Progress',
    description: 'Track multi-step tasks with built-in todo components and progress indicators.',
  },
  {
    icon: Palette,
    title: 'Fully Themeable',
    description: 'CSS variables for complete customization. Dark mode included.',
  },
  {
    icon: Zap,
    title: 'Streaming Ready',
    description: 'First-class support for streaming responses with smooth animations.',
  },
]

const codeExample = `import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

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
}`

// Chat Demo Components (embedded for the demo)
function DemoMessageBubble({ message }: { message: typeof demoConversation[0] }) {
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

function DemoThinkingBox({ thinking, isExpanded, onToggle }: { thinking: string; isExpanded: boolean; onToggle: () => void }) {
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

function DemoToolCall({ tool }: { tool: { id: string; name: string; input: Record<string, unknown>; status: string } }) {
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

function DemoTodoBox({ tasks }: { tasks: Array<{ id: string; label: string; status: string }> }) {
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
              <Loader2 className="w-4 h-4 text-accent chat-animate-spin" />
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

function InteractiveDemo() {
  const [messages, setMessages] = useState(demoConversation)
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

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500))

    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: "I've processed your request. The analysis is complete and the visualization has been generated successfully!",
      toolCalls: [
        { id: 't3', name: 'generate_chart', input: { type: 'line', data: 'revenue_data' }, status: 'complete' as const },
      ],
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsProcessing(false)
  }

  return (
    <div className="flex flex-col h-[600px] bg-surface rounded-2xl border border-surface-border overflow-hidden glow-accent">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface-elevated">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-sm text-zinc-400 font-mono">@vith-ai/chat-ui</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-600">Claude Sonnet</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id}>
            <DemoMessageBubble message={message} />
            {'thinking' in message && message.thinking && (
              <DemoThinkingBox
                thinking={message.thinking}
                isExpanded={thinkingExpanded}
                onToggle={() => setThinkingExpanded(!thinkingExpanded)}
              />
            )}
            {'toolCalls' in message && message.toolCalls && (
              <div className="mx-4 mb-2 space-y-2">
                {message.toolCalls.map(tool => (
                  <DemoToolCall key={tool.id} tool={tool} />
                ))}
              </div>
            )}
            {'tasks' in message && message.tasks && (
              <DemoTodoBox tasks={message.tasks} />
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 px-4 py-3 text-zinc-400">
            <Loader2 className="w-4 h-4 chat-animate-spin" />
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

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-xl border border-surface-border bg-surface-elevated overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border bg-surface">
        <span className="text-xs text-zinc-500 font-mono">App.tsx</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto code-block text-sm">
        <code className="text-zinc-300">{code}</code>
      </pre>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <div className="gradient-mesh" />
      <div className="noise" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border/50 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg">chat-ui</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-sm text-zinc-400 hover:text-white transition-colors">Demo</a>
            <a href="#code" className="text-sm text-zinc-400 hover:text-white transition-colors">Code</a>
            <a href="https://github.com/vith-ai/chat-ui" target="_blank" rel="noopener" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
          <a
            href="https://github.com/vith-ai/chat-ui"
            target="_blank"
            rel="noopener"
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Open Source
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display font-black text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6"
              >
                Chat UI for{' '}
                <span className="bg-gradient-to-r from-accent-light via-accent to-accent-dark bg-clip-text text-transparent">
                  Agentic AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl text-zinc-400 mb-8 max-w-lg"
              >
                Beautiful, production-ready React components for building chat interfaces.
                Tool calls, thinking, tasks — everything you need for agentic workflows.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-12"
              >
                <a
                  href="https://github.com/vith-ai/chat-ui"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-colors"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
                <a
                  href="#code"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-surface-border text-zinc-300 font-medium hover:bg-surface-elevated transition-colors"
                >
                  <Terminal className="w-5 h-5" />
                  Quick Start
                </a>
              </motion.div>

              {/* Providers */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-3">Works with</p>
                <div className="flex items-center gap-6">
                  {providers.map(provider => (
                    <div key={provider.name} className="flex items-center gap-2 text-zinc-500">
                      <span className="text-lg">{provider.logo}</span>
                      <span className="text-sm">{provider.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: Demo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              id="demo"
            >
              <InteractiveDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 border-t border-surface-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Everything you need for agentic chat
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Purpose-built components for modern AI applications. From simple chatbots to complex autonomous agents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-surface-border bg-surface-elevated/50 hover:border-accent/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section id="code" className="py-20 px-6 border-t border-surface-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Simple to use
            </h2>
            <p className="text-zinc-400">
              Get started with just a few lines of code. Full TypeScript support included.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border font-mono">
                npm install @vith-ai/chat-ui
              </div>
              <span className="text-zinc-500">or</span>
              <div className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border font-mono">
                pnpm add @vith-ai/chat-ui
              </div>
            </div>

            <CodeBlock code={codeExample} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-surface-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Ready to build?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            Join developers building the next generation of AI-powered applications.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://github.com/vith-ai/chat-ui"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-colors"
            >
              <Github className="w-5 h-5" />
              Star on GitHub
            </a>
            <a
              href="https://github.com/vith-ai/chat-ui#readme"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-surface-border text-zinc-300 font-medium hover:bg-surface-elevated transition-colors"
            >
              Read the Docs
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-surface-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-accent-light to-accent-dark flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-zinc-500">
              @vith-ai/chat-ui · MIT License
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="https://github.com/vith-ai/chat-ui" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://vith.ai" className="hover:text-white transition-colors">Vith AI</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
