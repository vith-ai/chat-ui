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
  FileCode,
  Image,
  Table,
  FileText,
  X,
  Shield,
  HelpCircle,
  Plus,
  Minus,
} from 'lucide-react'
import clsx from 'clsx'

// Types
interface DemoToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  status: 'pending' | 'running' | 'complete'
}

interface DemoTask {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface DemoApproval {
  id: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
}

interface DemoQuestion {
  id: string
  question: string
  options: string[]
}

interface DemoDiff {
  filename: string
  additions: string[]
  deletions: string[]
}

interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  toolCalls?: DemoToolCall[]
  tasks?: DemoTask[]
  artifact?: Artifact
  approval?: DemoApproval
  question?: DemoQuestion
  diff?: DemoDiff
}

interface Artifact {
  id: string
  type: 'code' | 'image' | 'chart' | 'table' | 'document'
  title: string
  content: string
  language?: string
}

// Demo responses - showcasing all features
interface DemoResponse {
  content: string
  thinking?: string
  toolCalls?: DemoToolCall[]
  tasks?: DemoTask[]
  artifact?: Artifact
  approval?: DemoApproval
  question?: DemoQuestion
  diff?: DemoDiff
}

const demoResponses: Record<string, DemoResponse> = {
  default: {
    content: "I can help you with that! Try one of the demo commands to see the UI components in action.",
  },
  analyze: {
    content: "I've analyzed the data and created a visualization showing the revenue trends over time.",
    thinking: "Looking at the data structure... I see columns for date, revenue, and customer_count. A line chart would best show the revenue trends over the time period.",
    toolCalls: [
      { id: 't1', name: 'read_file', input: { path: 'data.csv' }, status: 'complete' },
      { id: 't2', name: 'analyze_data', input: { columns: ['revenue', 'date'] }, status: 'complete' },
    ],
    tasks: [
      { id: 'task1', label: 'Load dataset', status: 'completed' },
      { id: 'task2', label: 'Analyze structure', status: 'completed' },
      { id: 'task3', label: 'Generate chart', status: 'completed' },
    ],
    artifact: {
      id: 'chart1',
      type: 'chart',
      title: 'Revenue Trends',
      content: `Monthly Revenue Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jan  ████████████████░░░░░░░░░░░░░░  $45,000
Feb  ██████████████████░░░░░░░░░░░░  $52,000
Mar  ████████████████████████░░░░░░  $68,000
Apr  ██████████████████████████░░░░  $74,000
May  ████████████████████████████░░  $82,000
Jun  ██████████████████████████████  $89,000

📈 Growth: +97.8% over 6 months
📊 Average: $68,333/month
🎯 Trend: Strong upward trajectory`,
    },
  },
  code: {
    content: "Here's a React component that implements the feature you requested.",
    thinking: "The user wants a reusable button component with variants. I'll create one with TypeScript support and Tailwind styling.",
    toolCalls: [
      { id: 't1', name: 'write_file', input: { path: 'src/Button.tsx' }, status: 'complete' },
    ],
    artifact: {
      id: 'code1',
      type: 'code',
      title: 'Button.tsx',
      language: 'typescript',
      content: `import { clsx } from 'clsx'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-lg font-medium transition-colors',
        {
          'bg-purple-500 text-white hover:bg-purple-600': variant === 'primary',
          'bg-zinc-800 text-white hover:bg-zinc-700': variant === 'secondary',
          'text-zinc-400 hover:text-white': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      {children}
    </button>
  )
}`,
    },
  },
  deploy: {
    content: "I'm ready to deploy. This will push to production and run database migrations.",
    thinking: "Checking deployment prerequisites... The build passed, tests are green, and the migration scripts look safe. I should ask for approval before proceeding with production deployment.",
    toolCalls: [
      { id: 't1', name: 'run_tests', input: { suite: 'all' }, status: 'complete' },
      { id: 't2', name: 'build', input: { target: 'production' }, status: 'complete' },
    ],
    approval: {
      id: 'deploy-approval',
      title: 'Deploy to Production',
      description: 'This will deploy v2.1.0 to production and run 3 pending migrations.',
      status: 'pending',
    },
  },
  refactor: {
    content: "I've refactored the authentication module. Here are the changes:",
    thinking: "The current auth implementation has some code duplication. I'll extract the common logic into a shared utility and update the imports.",
    toolCalls: [
      { id: 't1', name: 'read_file', input: { path: 'src/auth/login.ts' }, status: 'complete' },
      { id: 't2', name: 'edit_file', input: { path: 'src/auth/utils.ts' }, status: 'complete' },
    ],
    diff: {
      filename: 'src/auth/login.ts',
      additions: [
        "import { validateToken, refreshSession } from './utils'",
        "",
        "export async function login(credentials: Credentials) {",
        "  const token = await authenticate(credentials)",
        "  return validateToken(token)",
        "}",
      ],
      deletions: [
        "import jwt from 'jsonwebtoken'",
        "",
        "export async function login(credentials: Credentials) {",
        "  const token = await authenticate(credentials)",
        "  // Manual token validation (duplicated)",
        "  if (!jwt.verify(token, SECRET)) throw new Error('Invalid')",
        "  return token",
        "}",
      ],
    },
    artifact: {
      id: 'refactor1',
      type: 'code',
      title: 'utils.ts (new)',
      language: 'typescript',
      content: `import jwt from 'jsonwebtoken'

export function validateToken(token: string): boolean {
  return jwt.verify(token, process.env.JWT_SECRET!)
}

export async function refreshSession(token: string) {
  const decoded = jwt.decode(token)
  return jwt.sign(decoded, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  })
}`,
    },
  },
  question: {
    content: "I found multiple configuration options. Which approach would you prefer?",
    thinking: "There are several valid ways to set up the database connection. I should ask the user about their preferences before proceeding.",
    question: {
      id: 'db-question',
      question: 'How would you like to configure the database connection?',
      options: [
        'Environment variables (.env file)',
        'Config file (config.json)',
        'Connection string in code',
      ],
    },
  },
  help: {
    content: "Welcome! This demo showcases all the UI components. Try these commands:\n\n• **\"analyze data\"** → Tool calls, tasks, thinking, artifacts\n• **\"write code\"** → Code generation with artifact panel\n• **\"deploy\"** → Approval flow for sensitive actions\n• **\"refactor\"** → Diff view showing code changes\n• **\"configure\"** → Question cards for user input\n\nEach response demonstrates different agentic UI patterns.",
  },
}

// Components
function MessageBubble({ message }: { message: DemoMessage }) {
  const isUser = message.role === 'user'

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    const lines = content.split('\n')
    return lines.map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      if (line.startsWith('• ')) {
        return <div key={i} className="flex gap-2 ml-2"><span className="text-accent">•</span><span dangerouslySetInnerHTML={{ __html: line.slice(2) }} /></div>
      }
      if (!line.trim()) return <div key={i} className="h-2" />
      return <div key={i} dangerouslySetInnerHTML={{ __html: line }} />
    })
  }

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
        <div className="text-sm leading-relaxed">{renderContent(message.content)}</div>
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

function ToolCallCard({ tool }: { tool: DemoToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusColors = {
    pending: 'text-zinc-500',
    running: 'text-accent',
    complete: 'text-emerald-400',
  }

  return (
    <div className={clsx(
      'rounded-lg border border-surface-border overflow-hidden',
      tool.status === 'complete' ? 'bg-emerald-500/5' : 'bg-surface-elevated'
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface/50 transition-colors"
      >
        <Wrench className={clsx('w-4 h-4', statusColors[tool.status])} />
        <span className="text-sm font-medium font-mono">{tool.name}</span>
        {tool.status === 'running' ? (
          <Loader2 className="w-4 h-4 ml-auto text-accent animate-spin" />
        ) : tool.status === 'complete' ? (
          <CheckCircle className="w-4 h-4 ml-auto text-emerald-400" />
        ) : null}
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

function TodoBox({ tasks }: { tasks: DemoTask[] }) {
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

function ApprovalCard({ approval, onApprove, onReject }: { approval: DemoApproval; onApprove: () => void; onReject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 rounded-lg border border-amber-500/30 bg-amber-500/5 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/20">
        <Shield className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-amber-400">Approval Required</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium mb-1">{approval.title}</p>
        <p className="text-xs text-zinc-400 mb-3">{approval.description}</p>
        {approval.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-700 text-white text-sm font-medium hover:bg-zinc-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        ) : (
          <div className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            approval.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          )}>
            {approval.status === 'approved' ? (
              <><CheckCircle className="w-4 h-4" /> Approved</>
            ) : (
              <><X className="w-4 h-4" /> Rejected</>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function QuestionCard({ question, onAnswer }: { question: DemoQuestion; onAnswer: (answer: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-500/20">
        <HelpCircle className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-blue-400">Input Needed</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium mb-3">{question.question}</p>
        <div className="space-y-2">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => onAnswer(option)}
              className="w-full text-left px-3 py-2 rounded-lg bg-surface-elevated border border-surface-border text-sm hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function DiffView({ diff }: { diff: DemoDiff }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-2 rounded-lg border border-surface-border bg-surface-elevated overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border">
        <FileCode className="w-4 h-4 text-accent" />
        <span className="text-sm font-mono">{diff.filename}</span>
      </div>
      <div className="font-mono text-xs overflow-x-auto">
        {diff.deletions.map((line, i) => (
          <div key={`del-${i}`} className="flex bg-red-500/10">
            <span className="w-8 text-center text-red-400/50 border-r border-surface-border py-0.5">
              <Minus className="w-3 h-3 inline" />
            </span>
            <span className="flex-1 text-red-400 px-2 py-0.5">{line || ' '}</span>
          </div>
        ))}
        {diff.additions.map((line, i) => (
          <div key={`add-${i}`} className="flex bg-emerald-500/10">
            <span className="w-8 text-center text-emerald-400/50 border-r border-surface-border py-0.5">
              <Plus className="w-3 h-3 inline" />
            </span>
            <span className="flex-1 text-emerald-400 px-2 py-0.5">{line || ' '}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ArtifactPanel({ artifact, onClose }: { artifact: Artifact | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  if (!artifact) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-600">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Artifacts will appear here</p>
          <p className="text-xs mt-1">Try asking me to analyze data or write code</p>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const icons = {
    code: FileCode,
    image: Image,
    chart: Table,
    table: Table,
    document: FileText,
  }
  const Icon = icons[artifact.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">{artifact.title}</span>
          {artifact.language && (
            <span className="text-xs text-zinc-500 bg-surface px-2 py-0.5 rounded">{artifact.language}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">{artifact.content}</pre>
      </div>
    </motion.div>
  )
}

function ChatDemo() {
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Welcome! This demo showcases all the agentic UI components. Try these:\n\n• **\"analyze data\"** → Tool calls, tasks, thinking, charts\n• **\"write code\"** → Code generation with artifacts\n• **\"deploy\"** → Approval flow for sensitive actions\n• **\"refactor\"** → Diff view showing code changes\n• **\"configure\"** → Question cards for user input\n• **\"help\"** → See all available demos",
    },
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [thinkingExpanded, setThinkingExpanded] = useState(true)
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleApproval = (messageId: string, approved: boolean) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.approval) {
        return {
          ...msg,
          approval: { ...msg.approval, status: approved ? 'approved' : 'rejected' }
        }
      }
      return msg
    }))
    // Add follow-up message
    const followUp: DemoMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: approved
        ? "Deployment approved! Starting deployment to production...\n\n✓ Building application\n✓ Running migrations\n✓ Deploying to production\n\n🚀 Successfully deployed v2.1.0"
        : "Deployment cancelled. No changes were made to production.",
    }
    setTimeout(() => setMessages(prev => [...prev, followUp]), 500)
  }

  const handleQuestion = (messageId: string, answer: string) => {
    // Remove the question from the message
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, question: undefined }
      }
      return msg
    }))
    // Add user answer and follow-up
    const userAnswer: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: answer,
    }
    const followUp: DemoMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Got it! I'll configure the database using **${answer}**.\n\nConfiguration has been set up successfully. You can now connect to your database.`,
      toolCalls: [
        { id: 't1', name: 'write_config', input: { method: answer }, status: 'complete' },
      ],
    }
    setTimeout(() => {
      setMessages(prev => [...prev, userAnswer])
      setTimeout(() => setMessages(prev => [...prev, followUp]), 800)
    }, 300)
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input.toLowerCase()
    setInput('')
    setIsProcessing(true)

    // Determine response based on input
    let responseKey = 'default'
    if (userInput.includes('analyz') || userInput.includes('data') || userInput.includes('visual') || userInput.includes('chart')) {
      responseKey = 'analyze'
    } else if (userInput.includes('code') || userInput.includes('component') || userInput.includes('button') || userInput.includes('function') || userInput.includes('write')) {
      responseKey = 'code'
    } else if (userInput.includes('deploy') || userInput.includes('production') || userInput.includes('release')) {
      responseKey = 'deploy'
    } else if (userInput.includes('refactor') || userInput.includes('diff') || userInput.includes('change')) {
      responseKey = 'refactor'
    } else if (userInput.includes('config') || userInput.includes('question') || userInput.includes('setup') || userInput.includes('database')) {
      responseKey = 'question'
    } else if (userInput.includes('help') || userInput.includes('what can') || userInput.includes('demo')) {
      responseKey = 'help'
    }

    const response = demoResponses[responseKey]

    // Simulate processing with tool calls
    if (response.toolCalls) {
      // Show running tools
      const runningMessage: DemoMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        toolCalls: response.toolCalls.map((t, i) => ({
          ...t,
          status: i === 0 ? 'running' : 'pending',
        })),
      }
      setMessages(prev => [...prev, runningMessage])

      // Simulate tool completion
      for (let i = 0; i < response.toolCalls.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setMessages(prev => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg.toolCalls) {
            lastMsg.toolCalls = lastMsg.toolCalls.map((t, j) => ({
              ...t,
              status: j <= i ? 'complete' : j === i + 1 ? 'running' : 'pending',
            }))
          }
          return updated
        })
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      // Update with full response
      setMessages(prev => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        lastMsg.content = response.content
        lastMsg.thinking = response.thinking
        lastMsg.tasks = response.tasks
        lastMsg.artifact = response.artifact
        lastMsg.approval = response.approval
        lastMsg.diff = response.diff
        return [...updated]
      })
    } else {
      // Simple response (with possible question)
      await new Promise(resolve => setTimeout(resolve, 1000))
      const assistantMessage: DemoMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        thinking: response.thinking,
        artifact: response.artifact,
        question: response.question,
      }
      setMessages(prev => [...prev, assistantMessage])
    }

    if (response.artifact) {
      setCurrentArtifact(response.artifact)
    }

    setIsProcessing(false)
  }

  // Configurable panel ratio (default 40% chat / 60% artifact like Vith)
  const chatRatio = 40
  const artifactRatio = 60

  return (
    <div className="flex-1 flex min-h-0">
      {/* Chat */}
      <div
        className="flex flex-col min-w-0"
        style={{ flex: `${chatRatio} 0 0%` }}
      >
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
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mx-4 mb-2 space-y-2">
                  {message.toolCalls.map(tool => (
                    <ToolCallCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
              {message.tasks && <TodoBox tasks={message.tasks} />}
              {message.diff && <DiffView diff={message.diff} />}
              {message.approval && (
                <ApprovalCard
                  approval={message.approval}
                  onApprove={() => handleApproval(message.id, true)}
                  onReject={() => handleApproval(message.id, false)}
                />
              )}
              {message.question && (
                <QuestionCard
                  question={message.question}
                  onAnswer={(answer) => handleQuestion(message.id, answer)}
                />
              )}
            </div>
          ))}

          {isProcessing && messages[messages.length - 1]?.role === 'user' && (
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
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Try: analyze data, write code, deploy, refactor, configure..."
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl border border-surface-border bg-surface-elevated text-sm placeholder:text-zinc-600 focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
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

      {/* Artifact Panel */}
      <div
        className="border-l border-surface-border bg-surface-elevated hidden lg:block"
        style={{ flex: `${artifactRatio} 0 0%` }}
      >
        <ArtifactPanel artifact={currentArtifact} onClose={() => setCurrentArtifact(null)} />
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

// ============ DOCS PAGE ============

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
        <h2 className="text-lg font-semibold mb-3">2. Choose an adapter</h2>
        <div className="grid gap-2 text-sm">
          {[
            { icon: '◇', name: 'Claude', desc: 'Anthropic API' },
            { icon: '◈', name: 'OpenAI', desc: 'GPT-4, Azure, Groq' },
            { icon: '○', name: 'Ollama', desc: 'Local models' },
            { icon: '⬡', name: 'OpenRouter', desc: '100+ models' },
            { icon: '▣', name: 'Bedrock', desc: 'AWS models' },
          ].map(p => (
            <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
              <span>{p.icon}</span>
              <span className="font-medium">{p.name}</span>
              <span className="text-zinc-500">— {p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">3. Add to your app</h2>
        <CodeBlock code={`import { ChatContainer, useChat } from '@vith-ai/chat-ui'
import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'
import '@vith-ai/chat-ui/styles.css'

const adapter = createClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default function Chat() {
  const chat = useChat({ adapter })

  return (
    <ChatContainer
      messages={chat.messages}
      isProcessing={chat.isProcessing}
      onSend={chat.sendMessage}
      onStop={chat.stopProcessing}
    />
  )
}`} title="app.tsx" />
      </div>

      <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
        <p className="text-sm"><strong className="text-accent">That's it!</strong> You have a working chat. See the docs for tool calls, thinking, theming, and more.</p>
      </div>
    </div>
  )
}

function InstallationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Installation</h1>
        <p className="text-zinc-400">Install the package and configure your project.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Package Manager</h2>
        <div className="space-y-2">
          <CodeBlock code="npm install @vith-ai/chat-ui" language="bash" title="npm" />
          <CodeBlock code="pnpm add @vith-ai/chat-ui" language="bash" title="pnpm" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Import Styles</h2>
        <CodeBlock code={`import '@vith-ai/chat-ui/styles.css'`} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Next.js Setup</h2>
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
}`} />
      </div>
    </div>
  )
}

function AdaptersSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Model Adapters</h1>
        <p className="text-zinc-400">Connect to any LLM provider.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">◇ Claude / Anthropic</h2>
        <CodeBlock code={`import { createClaudeAdapter } from '@vith-ai/chat-ui/adapters/claude'

const adapter = createClaudeAdapter({
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  enableThinking: true,
  systemPrompt: 'You are helpful.',
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">◈ OpenAI</h2>
        <CodeBlock code={`import { createOpenAIAdapter } from '@vith-ai/chat-ui/adapters/openai'

const adapter = createOpenAIAdapter({
  apiKey: 'sk-...',
  model: 'gpt-4o',
})

// Azure OpenAI
const azure = createOpenAIAdapter({
  apiKey: process.env.AZURE_KEY,
  baseUrl: 'https://your-resource.openai.azure.com/...',
})

// Groq
const groq = createOpenAIAdapter({
  apiKey: process.env.GROQ_API_KEY,
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.1-70b-versatile',
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">○ Ollama (Local)</h2>
        <CodeBlock code={`import { createOllamaAdapter } from '@vith-ai/chat-ui/adapters/ollama'

const adapter = createOllamaAdapter({
  model: 'llama3',
  baseUrl: 'http://localhost:11434',
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">⬡ OpenRouter</h2>
        <CodeBlock code={`import { createOpenRouterAdapter } from '@vith-ai/chat-ui/adapters/openrouter'

const adapter = createOpenRouterAdapter({
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3-opus',
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Adapter</h2>
        <CodeBlock code={`const myAdapter: ChatAdapter = {
  providerName: 'My API',
  features: { streaming: true, thinking: false, toolUse: true },

  async sendMessage(messages, { onStream, signal }) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
      signal,
    })
    // Handle streaming...
    return { id: '...', role: 'assistant', content: '...' }
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
        <p className="text-zinc-400">All available components and props.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">ChatContainer</h2>
        <CodeBlock code={`<ChatContainer
  messages={messages}
  isProcessing={isProcessing}
  thinkingText={thinkingText}
  tasks={tasks}
  pendingQuestion={question}
  onSend={(msg) => {}}
  onStop={() => {}}
  onAnswerQuestion={(ans) => {}}
  toolRenderers={{ 'search': (tc) => <SearchUI {...tc} /> }}
  assistantAvatar={<Bot />}
  welcomeMessage={<Welcome />}
  theme={{ accent: '#6366f1' }}
/>`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Individual Components</h2>
        <CodeBlock code={`import {
  MessageBubble,
  ThinkingBox,
  ToolCallCard,
  TodoBox,
  ApprovalCard,
  DiffView,
  QuestionCard,
} from '@vith-ai/chat-ui'`} />
      </div>
    </div>
  )
}

function HooksSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Hooks</h1>
        <p className="text-zinc-400">React hooks for chat state.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">useChat</h2>
        <CodeBlock code={`const {
  messages,
  isProcessing,
  thinkingText,
  tasks,
  pendingQuestion,
  sendMessage,
  stopProcessing,
  answerQuestion,
  addMessage,
  clearMessages,
} = useChat({
  adapter,
  initialMessages: [],
  onSend: (msg) => {},
  onResponse: (msg) => {},
  onError: (err) => {},
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Without Adapter</h2>
        <CodeBlock code={`const chat = useChat()  // no adapter

const handleSend = async (content) => {
  chat.addMessage({ id: '1', role: 'user', content })
  const response = await myApi.chat(content)
  chat.addMessage({ id: '2', role: 'assistant', content: response })
}

<ChatContainer messages={chat.messages} onSend={handleSend} />`} />
      </div>
    </div>
  )
}

function CustomizationSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Customization</h1>
        <p className="text-zinc-400">Customize avatars, tools, and behavior.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Tool Renderers</h2>
        <CodeBlock code={`<ChatContainer
  toolRenderers={{
    'search_web': (tc) => <SearchResults results={tc.output} />,
    'run_code': (tc) => <CodeOutput code={tc.input.code} result={tc.output} />,
  }}
/>`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Avatars</h2>
        <CodeBlock code={`<ChatContainer
  assistantAvatar={<img src="/bot.png" className="w-full h-full rounded-full" />}
  userAvatar={<User className="w-5 h-5" />}
/>`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Layout & Panel Ratios</h2>
        <p className="text-sm text-zinc-400 mb-3">
          Configure the chat/artifact panel split ratio. Default is 40/60 (40% chat, 60% artifact).
        </p>
        <CodeBlock code={`<ChatContainer
  layout={{
    chatRatio: 40,      // Chat panel width (%)
    artifactRatio: 60,  // Artifact panel width (%)
    minChatWidth: 280,  // Minimum chat width (px)
    minArtifactWidth: 300, // Minimum artifact width (px)
  }}
  showArtifactPanel={true}  // Toggle artifact panel visibility
/>`} />
        <p className="text-sm text-zinc-400 mt-3">
          Common configurations:
        </p>
        <div className="grid gap-2 text-sm mt-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="font-mono text-accent">40/60</span>
            <span className="text-zinc-500">— Default (like Vith)</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="font-mono text-accent">50/50</span>
            <span className="text-zinc-500">— Equal split</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="font-mono text-accent">30/70</span>
            <span className="text-zinc-500">— Code-focused</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemingSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Theming</h1>
        <p className="text-zinc-400">Customize colors and appearance.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">CSS Variables</h2>
        <CodeBlock code={`:root {
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
}`} language="css" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Theme Prop</h2>
        <CodeBlock code={`<ChatContainer
  theme={{
    bg: '#ffffff',
    surface: '#f4f4f5',
    accent: '#6366f1',
  }}
/>`} />
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
        <h2 className="text-lg font-semibold">Persist Messages</h2>
        <CodeBlock code={`useEffect(() => {
  localStorage.setItem('chat', JSON.stringify(chat.messages))
}, [chat.messages])`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Error Handling</h2>
        <CodeBlock code={`const chat = useChat({
  adapter,
  onError: (err) => {
    if (err.message.includes('401')) toast.error('Invalid API key')
    else if (err.message.includes('429')) toast.error('Rate limited')
    else toast.error('Something went wrong')
  },
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dynamic System Prompt</h2>
        <CodeBlock code={`const adapter = useMemo(() =>
  createClaudeAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY,
    systemPrompt: \`You are helping with \${currentFile?.name}\`,
  }),
  [currentFile]
)`} />
      </div>
    </div>
  )
}

function TypesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">TypeScript</h1>
        <p className="text-zinc-400">Type definitions.</p>
      </div>

      <CodeBlock code={`interface ChatMessage {
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

interface ChatAdapter {
  providerName: string
  features: { streaming: boolean; thinking: boolean; toolUse: boolean }
  sendMessage(messages: ChatMessage[], options?: SendOptions): Promise<ChatMessage>
}`} />
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
