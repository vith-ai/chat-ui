import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { codeToHtml } from 'shiki'
import {
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
  Plus,
  Minus,
  PanelRight,
  Sparkles,
  Sun,
  Moon,
  MessageSquare,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'

// Import from the library
import {
  ChatContainer,
  useChat,
  createLocalStorageStore,
} from '@vith-ai/chat-ui'
import type {
  ChatMessage,
  ChatAdapter,
  ToolCall,
  TaskItem,
  ApprovalRequest,
  FileChange,
  PendingQuestion,
  Artifact,
  Conversation,
} from '@vith-ai/chat-ui'
// Import the library styles
import '@vith-ai/chat-ui/styles.css'

// Extended message type for demo (extends ChatMessage which has artifacts: Artifact[])
interface DemoMessage extends Omit<ChatMessage, 'toolCalls'> {
  toolCalls?: ToolCall[]
  tasks?: TaskItem[]
  approval?: ApprovalRequest
  question?: PendingQuestion
  diff?: FileChange
}

// Demo responses - showcasing all features
interface DemoResponse {
  content: string
  thinking?: string
  toolCalls?: ToolCall[]
  tasks?: TaskItem[]
  artifacts?: Artifact[]
  approval?: ApprovalRequest
  question?: PendingQuestion
  diff?: FileChange
}

const demoResponses: Record<string, DemoResponse> = {
  default: {
    content: "This demo isn't connected to a live AI model — it's a showcase of the UI components.\n\nTo see the components in action, try one of these:\n\n• **\"analyze data\"** → Tool calls, tasks, thinking, charts\n• **\"write code\"** → Code generation with artifacts\n• **\"deploy\"** → Approval flow\n• **\"refactor\"** → Diff view\n• **\"configure\"** → Question cards\n\nWant to connect it to a real model? Check out the **Docs** to integrate with Claude, OpenAI, Ollama, or any LLM.",
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
    artifacts: [{
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
    }],
  },
  code: {
    content: "Here's a React component that implements the feature you requested.",
    thinking: "The user wants a reusable button component with variants. I'll create one with TypeScript support and Tailwind styling.",
    toolCalls: [
      { id: 't1', name: 'write_file', input: { path: 'src/Button.tsx' }, status: 'complete' },
    ],
    artifacts: [{
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
          'bg-surface-elevated text-white hover:bg-surface-border': variant === 'secondary',
          'text-[color:var(--chat-text-secondary)] hover:text-[color:var(--chat-text)]': variant === 'ghost',
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
    }],
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
      action: 'Deploy v2.1.0 to production',
      risk: 'high',
      details: 'This will run 3 pending database migrations and update the live site.',
      code: 'npm run deploy --target=production',
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
      path: 'src/auth/login.ts',
      type: 'modified',
      language: 'typescript',
      before: `import jwt from 'jsonwebtoken'

export async function login(credentials: Credentials) {
  const token = await authenticate(credentials)
  // Manual token validation (duplicated)
  if (!jwt.verify(token, SECRET)) throw new Error('Invalid')
  return token
}`,
      after: `import { validateToken, refreshSession } from './utils'

export async function login(credentials: Credentials) {
  const token = await authenticate(credentials)
  return validateToken(token)
}`,
    },
    artifacts: [{
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
    }],
  },
  question: {
    content: "I found multiple configuration options. Which approach would you prefer?",
    thinking: "There are several valid ways to set up the database connection. I should ask the user about their preferences before proceeding.",
    question: {
      id: 'db-question',
      question: 'How would you like to configure the database connection?',
      options: [
        { label: 'Environment variables', description: 'Store in .env file (recommended)' },
        { label: 'Config file', description: 'Store in config.json' },
        { label: 'Connection string', description: 'Hardcode in source' },
      ],
    },
  },
  spreadsheet: {
    content: "I've created a financial model based on your requirements. The spreadsheet includes projections and formulas for key metrics.",
    thinking: "Building a financial model with revenue projections, expenses, and cash flow calculations. I'll use standard SaaS metrics and include formulas for key ratios.",
    toolCalls: [
      { id: 't1', name: 'create_spreadsheet', input: { template: 'financial_model' }, status: 'complete' },
      { id: 't2', name: 'add_formulas', input: { cells: ['D2:D13', 'E2:E13'] }, status: 'complete' },
    ],
    tasks: [
      { id: 'task1', label: 'Create worksheet structure', status: 'completed' },
      { id: 'task2', label: 'Add revenue projections', status: 'completed' },
      { id: 'task3', label: 'Calculate expenses', status: 'completed' },
      { id: 'task4', label: 'Generate cash flow', status: 'completed' },
    ],
    artifacts: [{
      id: 'spreadsheet1',
      type: 'spreadsheet',
      title: 'Financial Model Q1-Q4',
      content: JSON.stringify({
        headers: ['Month', 'Revenue', 'Expenses', 'EBITDA', 'Margin %'],
        rows: [
          ['Jan', 45000, 32000, 13000, '28.9%'],
          ['Feb', 52000, 34000, 18000, '34.6%'],
          ['Mar', 61000, 36000, 25000, '41.0%'],
          ['Apr', 68000, 38000, 30000, '44.1%'],
          ['May', 75000, 40000, 35000, '46.7%'],
          ['Jun', 82000, 42000, 40000, '48.8%'],
          ['Total', 383000, 222000, 161000, '42.0%'],
        ],
      }),
    }],
  },
  search: {
    content: "I searched for the latest information and found several relevant sources. Here's a summary of what I found.",
    thinking: "The user wants current information. I'll search multiple sources and synthesize the findings into a clear summary.",
    toolCalls: [
      { id: 't1', name: 'web_search', input: { query: 'React 19 new features 2024' }, status: 'complete' },
      { id: 't2', name: 'fetch_url', input: { url: 'https://react.dev/blog' }, status: 'complete' },
      { id: 't3', name: 'fetch_url', input: { url: 'https://github.com/facebook/react' }, status: 'complete' },
    ],
    artifacts: [{
      id: 'search1',
      type: 'document',
      title: 'Search Results Summary',
      content: `# React 19 New Features

## Server Components
React Server Components are now stable, enabling:
- Zero-bundle-size components
- Direct database access
- Streaming rendering

## Actions
New form handling with automatic:
- Pending states
- Optimistic updates
- Error handling

## New Hooks
- \`useFormStatus()\` - Form submission state
- \`useOptimistic()\` - Optimistic UI updates
- \`use()\` - Read resources in render

## Asset Loading
Built-in support for:
- Preloading stylesheets
- Font optimization
- Script prioritization

---
*Sources: react.dev, GitHub, React RFC discussions*`,
    }],
  },
  build: {
    content: "Starting the build process. I'll compile the code, run tests, and generate the production bundle.",
    thinking: "This is a multi-step build process. I need to run each step sequentially and report progress.",
    toolCalls: [
      { id: 't1', name: 'run_command', input: { cmd: 'npm run lint' }, status: 'complete' },
      { id: 't2', name: 'run_command', input: { cmd: 'npm run typecheck' }, status: 'complete' },
      { id: 't3', name: 'run_command', input: { cmd: 'npm run test' }, status: 'complete' },
      { id: 't4', name: 'run_command', input: { cmd: 'npm run build' }, status: 'complete' },
    ],
    tasks: [
      { id: 'task1', label: 'Lint code', status: 'completed' },
      { id: 'task2', label: 'Type checking', status: 'completed' },
      { id: 'task3', label: 'Run tests (47 passed)', status: 'completed' },
      { id: 'task4', label: 'Build production bundle', status: 'completed' },
      { id: 'task5', label: 'Generate source maps', status: 'completed' },
      { id: 'task6', label: 'Optimize assets', status: 'completed' },
    ],
    artifacts: [{
      id: 'build1',
      type: 'document',
      title: 'Build Output',
      content: `Build completed successfully!

📦 Bundle Analysis:
├── dist/index.js      142.3 KB (gzip: 45.2 KB)
├── dist/index.css      18.7 KB (gzip:  4.1 KB)
├── dist/vendor.js     287.1 KB (gzip: 92.4 KB)
└── dist/assets/       12 files

⚡ Performance:
• Build time: 4.2s
• Tree-shaking removed 34% of code
• CSS purged 67% unused styles

✅ All 47 tests passed
✅ No TypeScript errors
✅ No linting warnings`,
    }],
  },
  image: {
    content: "I've generated an image based on your description. Here's a beautiful mountain landscape at sunset.",
    thinking: "Processing the image generation request... Creating a scenic mountain landscape with warm sunset colors.",
    toolCalls: [
      { id: 't1', name: 'generate_image', input: { prompt: 'mountain landscape at sunset, dramatic lighting' }, status: 'complete' },
    ],
    artifacts: [{
      id: 'image1',
      type: 'image',
      title: 'Generated Landscape',
      content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    }],
  },
  pdf: {
    content: "I've generated the quarterly report as a PDF. You can view it in the artifact panel.",
    thinking: "Compiling the quarterly data into a professional PDF report with key metrics and visualizations.",
    toolCalls: [
      { id: 't1', name: 'generate_pdf', input: { template: 'quarterly_report', quarter: 'Q4' }, status: 'complete' },
    ],
    artifacts: [{
      id: 'pdf1',
      type: 'pdf',
      title: 'Q4 2024 Report.pdf',
      content: 'quarterly-report.pdf',
    }],
  },
  help: {
    content: "This demo showcases all the agentic UI components. Available commands:\n\n• **\"analyze data\"** → Tool calls, tasks, thinking, charts\n• **\"write code\"** → Syntax-highlighted code artifact\n• **\"spreadsheet\"** → Interactive spreadsheet viewer\n• **\"pdf\"** or **\"report\"** → PDF document viewer\n• **\"search\"** → Web search with multiple tools\n• **\"build\"** → Multi-step task progress\n• **\"image\"** → Image generation artifact\n• **\"deploy\"** → Approval flow\n• **\"refactor\"** → Diff view\n• **\"configure\"** → Question cards\n\nEach response demonstrates different agentic UI patterns. Check out the **Docs** to learn how to integrate these into your app.",
  },
}

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock adapter that simulates LLM streaming - dogfoods the useChat hook
function createMockAdapter(): ChatAdapter {
  return {
    providerName: 'Demo',
    features: { streaming: true, thinking: true, toolUse: true },
    async sendMessage(messages, options) {
      const lastMessage = messages[messages.length - 1]
      const userInput = lastMessage?.content.toLowerCase() || ''

      // Determine response based on input
      let responseKey = 'default'
      if (userInput.includes('analyz') || userInput.includes('visual') || userInput.includes('chart')) {
        responseKey = 'analyze'
      } else if (userInput.includes('code') || userInput.includes('component') || userInput.includes('button') || userInput.includes('function') || userInput.includes('write')) {
        responseKey = 'code'
      } else if (userInput.includes('spreadsheet') || userInput.includes('excel') || userInput.includes('financial') || userInput.includes('model')) {
        responseKey = 'spreadsheet'
      } else if (userInput.includes('search') || userInput.includes('find') || userInput.includes('look up') || userInput.includes('research')) {
        responseKey = 'search'
      } else if (userInput.includes('build') || userInput.includes('compile') || userInput.includes('test')) {
        responseKey = 'build'
      } else if (userInput.includes('image') || userInput.includes('picture') || userInput.includes('photo') || userInput.includes('generate')) {
        responseKey = 'image'
      } else if (userInput.includes('pdf') || userInput.includes('report') || userInput.includes('document')) {
        responseKey = 'pdf'
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

      // Simulate tool calls
      if (response.toolCalls) {
        for (let i = 0; i < response.toolCalls.length; i++) {
          const tc = response.toolCalls[i]
          options?.onToolCall?.({ ...tc, status: 'running' })
          await delay(600)
          options?.onToolCall?.({ ...tc, status: 'complete' })
          await delay(200)
        }
      }

      // Simulate thinking
      if (response.thinking) {
        const words = response.thinking.split(' ')
        let accumulated = ''
        for (const word of words) {
          accumulated += (accumulated ? ' ' : '') + word
          options?.onThinking?.(accumulated)
          await delay(30)
        }
        await delay(200)
      }

      // Simulate content streaming
      const words = response.content.split(' ')
      for (const word of words) {
        options?.onStream?.(word + ' ')
        await delay(25)
      }

      // Return final response with all demo fields
      return {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: response.content,
        thinking: response.thinking,
        toolCalls: response.toolCalls,
        // Demo-specific fields stored on message
        tasks: response.tasks,
        artifacts: response.artifacts,
        approval: response.approval,
        question: response.question,
        diff: response.diff,
      } as DemoMessage
    },
  }
}

const mockAdapter = createMockAdapter()

// Artifact renderers (demo-specific - library provides ArtifactRegistry for type detection)
// Rich Spreadsheet Viewer
function SpreadsheetViewer({ data }: { data: { headers: string[]; rows: (string | number)[][] } }) {
  const formatCell = (value: string | number) => {
    if (typeof value === 'number') {
      // Format numbers as currency
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
    return value
  }

  return (
    <div className="w-full h-full overflow-auto rounded-lg border border-surface-border" style={{ background: 'var(--surface)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-elevated/50 border-b border-surface-border">
        <div className="flex items-center gap-0.5">
          {['B', 'I', 'U'].map(btn => (
            <button key={btn} className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-[color:var(--chat-text-secondary)] hover:bg-surface-border rounded">
              {btn}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-surface-border mx-1" />
        <div className="flex items-center gap-0.5">
          {['$', '%', ','].map(btn => (
            <button key={btn} className="w-7 h-7 flex items-center justify-center text-xs text-[color:var(--chat-text-secondary)] hover:bg-surface-border rounded">
              {btn}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[color:var(--chat-text-secondary)]">Financial Model</div>
      </div>
      {/* Spreadsheet Grid */}
      <div className="overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {/* Row number header */}
              <th className="w-10 min-w-[40px] bg-surface-elevated border-r border-b border-surface-border text-[color:var(--chat-text-secondary)] text-xs p-1"></th>
              {/* Column headers (A, B, C...) */}
              {data.headers.map((_, i) => (
                <th key={i} className="min-w-[100px] bg-surface-elevated border-r border-b border-surface-border text-[color:var(--chat-text-secondary)] text-xs font-normal p-1">
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
            <tr>
              <th className="bg-surface-elevated border-r border-b border-surface-border text-[color:var(--chat-text-secondary)] text-xs p-1">1</th>
              {data.headers.map((header, i) => (
                <th key={i} className="bg-accent/10 border-r border-b border-surface-border text-accent font-semibold p-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => {
              const isTotal = row[0] === 'Total'
              return (
                <tr key={rowIdx} className={isTotal ? 'bg-accent/5' : ''}>
                  <td className="bg-surface-elevated border-r border-b border-surface-border text-[color:var(--chat-text-secondary)] text-xs p-1 text-center">
                    {rowIdx + 2}
                  </td>
                  {row.map((cell, colIdx) => (
                    <td
                      key={colIdx}
                      className={clsx(
                        'border-r border-b border-surface-border/50 p-2',
                        colIdx === 0 ? 'text-[color:var(--chat-text)]' : 'text-[color:var(--chat-text-secondary)] font-mono text-right',
                        isTotal && 'font-semibold'
                      )}
                    >
                      {colIdx === 0 ? cell : formatCell(cell)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Formula bar simulation */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-elevated/30 border-t border-surface-border text-xs">
        <span className="text-[color:var(--chat-text-secondary)]">fx</span>
        <span className="text-[color:var(--chat-text-secondary)] font-mono">=SUM(B2:B7)</span>
      </div>
    </div>
  )
}

// Syntax-highlighted Code Viewer using Shiki
function CodeViewer({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    }).then(result => {
      setHtml(result)
      setIsLoading(false)
    }).catch(() => {
      // Fallback to plain text if language not supported
      setHtml(`<pre class="shiki"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      setIsLoading(false)
    })
  }, [code, language])

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-surface-elevated rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-surface-elevated rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-surface-elevated rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-lg overflow-hidden border border-surface-border">
      {/* Editor-like header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-surface-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <span className="text-xs text-[color:var(--chat-text-secondary)] ml-2 font-mono">{language}</span>
      </div>
      {/* Code with line numbers */}
      <div className="overflow-auto max-h-[500px]">
        <div
          className="p-4 text-sm [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:!text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}

// PDF Viewer component
function PDFViewer({ title }: { title: string }) {
  return (
    <div className="bg-surface rounded-lg overflow-hidden border border-surface-border h-full flex flex-col">
      {/* PDF toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-elevated border-b border-surface-border">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-400" />
          <span className="text-sm text-[color:var(--chat-text)]">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-[color:var(--chat-text-secondary)] hover:text-[color:var(--chat-text)] hover:bg-surface-border rounded">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xs text-[color:var(--chat-text-secondary)] px-2">100%</span>
          <button className="p-1.5 text-[color:var(--chat-text-secondary)] hover:text-[color:var(--chat-text)] hover:bg-surface-border rounded">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* PDF preview */}
      <div className="flex-1 bg-surface p-4 overflow-auto">
        <div className="bg-white rounded shadow-2xl mx-auto max-w-lg p-8 text-zinc-900 min-h-[400px]">
          {/* Simulated PDF content */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-zinc-800">Quarterly Report</h1>
            <p className="text-sm text-[color:var(--chat-text-secondary)] mt-1">Q4 2024 Financial Summary</p>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <h2 className="font-semibold text-zinc-700 mb-2">Executive Summary</h2>
              <p className="text-[color:var(--chat-text-secondary)] leading-relaxed">
                Revenue increased 23% YoY to $4.2M. Operating margin improved to 18%.
                Customer acquisition cost decreased by 15% while lifetime value increased 28%.
              </p>
            </div>
            <div className="border-t pt-4">
              <h2 className="font-semibold text-zinc-700 mb-2">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-100 p-2 rounded">
                  <div className="text-[color:var(--chat-text-secondary)]">ARR</div>
                  <div className="font-semibold">$4.2M</div>
                </div>
                <div className="bg-zinc-100 p-2 rounded">
                  <div className="text-[color:var(--chat-text-secondary)]">Growth</div>
                  <div className="font-semibold text-green-600">+23%</div>
                </div>
                <div className="bg-zinc-100 p-2 rounded">
                  <div className="text-[color:var(--chat-text-secondary)]">Customers</div>
                  <div className="font-semibold">1,247</div>
                </div>
                <div className="bg-zinc-100 p-2 rounded">
                  <div className="text-[color:var(--chat-text-secondary)]">NPS</div>
                  <div className="font-semibold">72</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-[color:var(--chat-text-secondary)]">
            Page 1 of 12
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom ArtifactPanel for demo - showcases rich rendering with Shiki, charts, etc.
// The library provides a basic ArtifactPanel (LibraryArtifactPanel) that works out of the box.
// This demo version shows how to build richer experiences on top of the library's Artifact type.
function ArtifactPanel({ artifact, onClose }: { artifact: Artifact | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  if (!artifact) {
    return (
      <div className="h-full flex items-center justify-center text-[color:var(--chat-text-secondary)]">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Artifacts will appear here</p>
          <p className="text-xs mt-1">Try: spreadsheet, search, build, analyze...</p>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const icons: Record<string, typeof FileCode> = {
    code: FileCode,
    image: Image,
    chart: Table,
    table: Table,
    document: FileText,
    spreadsheet: Table,
    pdf: FileText,
  }
  const Icon = icons[artifact.type] || FileCode

  // Rich rendering based on artifact type
  const renderContent = () => {
    if (artifact.type === 'spreadsheet') {
      try {
        const data = JSON.parse(artifact.content)
        return <SpreadsheetViewer data={data} />
      } catch {
        return <pre className="text-sm font-mono whitespace-pre-wrap" style={{ color: 'var(--chat-text)' }}>{artifact.content}</pre>
      }
    }

    if (artifact.type === 'code') {
      return <CodeViewer code={artifact.content} language={artifact.language || 'typescript'} />
    }

    if (artifact.type === 'pdf') {
      return <PDFViewer title={artifact.title} />
    }

    if (artifact.type === 'image') {
      return (
        <div className="flex items-center justify-center h-full bg-surface rounded-lg p-4">
          <img
            src={artifact.content}
            alt={artifact.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )
    }

    if (artifact.type === 'table') {
      // Try to parse as structured table data
      const lines = artifact.content.split('\n').filter(l => l.trim())

      // Check if it's a simple CSV-like format or has table structure
      const hasTableChars = lines.some(l => l.includes('│') || l.includes('|') || l.includes('┌'))

      if (hasTableChars) {
        // Parse the ASCII table into rows
        const dataLines = lines.filter(l =>
          !l.includes('┌') && !l.includes('└') && !l.includes('├') &&
          !l.includes('─') && !l.startsWith('📊') && !l.startsWith('•') &&
          l.includes('│')
        )

        const rows = dataLines.map(line =>
          line.split('│').map(cell => cell.trim()).filter(cell => cell)
        )

        if (rows.length > 0) {
          const headerRow = rows[0]
          const dataRows = rows.slice(1)

          // Get footer content (metrics)
          const footerLines = lines.filter(l => l.startsWith('📊') || l.startsWith('•'))

          return (
            <div className="space-y-4">
              <div className="bg-surface/50 rounded-lg overflow-hidden border border-surface-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-accent/10 border-b border-surface-border">
                        {headerRow.map((cell, i) => (
                          <th key={i} className="px-4 py-3 text-left font-semibold text-accent">{cell}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.map((row, i) => (
                        <tr key={i} className={clsx(
                          'border-b border-surface-border/50',
                          row[0] === 'Total' && 'bg-accent/5 font-semibold'
                        )}>
                          {row.map((cell, j) => (
                            <td key={j} className={clsx(
                              'px-4 py-2',
                              j === 0 ? 'text-[color:var(--chat-text)]' : 'text-[color:var(--chat-text-secondary)] font-mono'
                            )}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {footerLines.length > 0 && (
                <div className="bg-surface/30 rounded-lg p-4 border border-surface-border/50">
                  {footerLines.map((line, i) => (
                    <p key={i} className="text-sm text-[color:var(--chat-text-secondary)]">{line}</p>
                  ))}
                </div>
              )}
            </div>
          )
        }
      }

      // Fallback to pre-formatted text
      return (
        <div className="bg-surface/50 rounded-lg overflow-hidden border border-surface-border">
          <div className="overflow-x-auto">
            <pre className="text-sm font-mono text-[color:var(--chat-text)] p-4 whitespace-pre leading-relaxed">{artifact.content}</pre>
          </div>
        </div>
      )
    }

    if (artifact.type === 'chart') {
      return (
        <div className="bg-surface/50 rounded-lg p-6 border border-surface-border">
          <pre className="text-sm font-mono text-[color:var(--chat-text)] whitespace-pre leading-relaxed">{artifact.content}</pre>
        </div>
      )
    }

    if (artifact.type === 'document') {
      // Render markdown-like content with better styling
      const lines = artifact.content.split('\n')
      return (
        <div className="prose prose-invert prose-sm max-w-none">
          {lines.map((line, i) => {
            if (line.startsWith('# ')) {
              return <h1 key={i} className="text-xl font-bold mt-4 mb-2" style={{ color: 'var(--chat-text)' }}>{line.slice(2)}</h1>
            }
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--chat-text)' }}>{line.slice(3)}</h2>
            }
            if (line.startsWith('- ')) {
              return <li key={i} className="text-[color:var(--chat-text)] ml-4">{line.slice(2)}</li>
            }
            if (line.startsWith('```')) {
              return null
            }
            if (line.startsWith('*') && line.endsWith('*')) {
              return <p key={i} className="text-[color:var(--chat-text-secondary)] italic text-sm">{line.slice(1, -1)}</p>
            }
            if (line.trim() === '---') {
              return <hr key={i} className="border-surface-border my-4" />
            }
            if (line.trim()) {
              return <p key={i} className="text-[color:var(--chat-text)] mb-2">{line}</p>
            }
            return <div key={i} className="h-2" />
          })}
        </div>
      )
    }

    // Default: plain text
    return <pre className="text-sm font-mono text-[color:var(--chat-text)] whitespace-pre-wrap">{artifact.content}</pre>
  }

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
            <span className="text-xs text-[color:var(--chat-text-secondary)] bg-surface px-2 py-0.5 rounded">{artifact.language}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-[color:var(--chat-text-secondary)] hover:text-[color:var(--chat-text)] transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[color:var(--chat-text-secondary)] hover:text-[color:var(--chat-text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>
    </motion.div>
  )
}

// Create conversation store once (outside component to avoid recreation)
const conversationStore = typeof window !== 'undefined'
  ? createLocalStorageStore('chat-ui-demo-conversations')
  : undefined

function ChatDemo() {
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null)

  // Dogfood the useChat hook with mock adapter AND integrated conversation management
  const {
    messages: chatMessages,
    isProcessing,
    thinkingText: streamingThinking,
    sendMessage: sendChatMessage,
    setMessages: setChatMessages,
    stopProcessing,
    // Integrated conversation management - no manual wiring needed!
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation: deleteConv,
  } = useChat({
    adapter: mockAdapter,
    conversationStore,
  })

  // Cast messages to DemoMessage for demo-specific fields
  const messages = chatMessages as DemoMessage[]
  const setMessages = setChatMessages as React.Dispatch<React.SetStateAction<DemoMessage[]>>
  const [showArtifactPanel, setShowArtifactPanel] = useState(true)
  const [showConversationList, setShowConversationList] = useState(false)
  const conversationDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (conversationDropdownRef.current && !conversationDropdownRef.current.contains(e.target as Node)) {
        setShowConversationList(false)
      }
    }
    if (showConversationList) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showConversationList])

  const createNewConversation = async () => {
    await createConversation()
    setCurrentArtifact(null)
    setShowConversationList(false)
  }

  const loadConversation = async (conv: Conversation) => {
    await selectConversation(conv.id)
    setCurrentArtifact(null)
    setShowConversationList(false)
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteConv(convId)
  }

  const handleApproval = (messageId: string, approved: boolean) => {
    // Remove the approval from the message (it's been handled)
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, approval: undefined }
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

  // Handle question answers from ChatContainer
  const handleAnswerQuestion = (answer: string | string[]) => {
    const answerText = Array.isArray(answer) ? answer.join(', ') : answer
    // Add follow-up message
    const followUp: DemoMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Got it! I'll configure the database using **${answerText}**.\n\nConfiguration has been set up successfully. You can now connect to your database.`,
      toolCalls: [
        { id: 't1', name: 'write_config', input: { method: answerText }, status: 'complete' },
      ],
    }
    setTimeout(() => setMessages(prev => [...prev, followUp]), 300)
  }

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isProcessing) return

    // Create a new conversation if none exists
    // The conversationStore auto-persists messages and auto-generates titles
    if (!currentConversation) {
      await createConversation()
    }

    // Use the mock adapter via useChat - this dogfoods the library
    await sendChatMessage(messageText)

    // Show artifact panel if response has one (check after a tick to get updated messages)
    setTimeout(() => {
      // We need to check from messages state at this point
    }, 100)
  }

  // Get tasks from the last assistant message (for ChatContainer)
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant') as DemoMessage | undefined
  const currentTasks = lastAssistantMessage?.tasks

  // Get pending question from the last assistant message
  const pendingQuestion = lastAssistantMessage?.question

  // Get pending approval from the last assistant message
  const pendingApproval = lastAssistantMessage?.approval

  // Get diffs from the last assistant message (wrap in array for ChatContainer)
  const currentDiffs = lastAssistantMessage?.diff ? [lastAssistantMessage.diff] : undefined

  // Handle approval response via ChatContainer
  const handleAnswerApproval = (approved: boolean) => {
    if (!lastAssistantMessage?.id) return
    handleApproval(lastAssistantMessage.id, approved)
  }

  // Render message extras (artifact buttons) - called by ChatContainer
  // Note: Approval and diff are now handled by ChatContainer via pendingApproval and diffs props
  const renderMessageExtras = (message: ChatMessage, isStreaming: boolean) => {
    const demoMsg = message as DemoMessage
    return (
      <>
        {/* Artifact button */}
        {demoMsg.artifacts?.[0] && !isStreaming && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => {
              setCurrentArtifact(demoMsg.artifacts![0])
              setShowArtifactPanel(true)
            }}
            className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20 text-accent text-sm hover:bg-accent/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>View {demoMsg.artifacts[0].type}: {demoMsg.artifacts[0].title}</span>
            <PanelRight className="w-4 h-4 ml-auto" />
          </motion.button>
        )}
      </>
    )
  }

  // Welcome message (suggestion buttons are handled by ChatContainer's suggestions prop)
  const welcomeMessage = (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-3 mx-auto">
        <MessageSquare className="w-6 h-6 text-accent" />
      </div>
      <h2 className="text-sm font-medium mb-1" style={{ color: 'var(--chat-text)' }}>
        Start a conversation
      </h2>
      <p className="text-xs" style={{ color: 'var(--chat-text-secondary)' }}>
        Try a command below
      </p>
    </div>
  )

  // Handle artifact from ChatContainer
  const handleArtifact = (artifact: Artifact) => {
    setCurrentArtifact(artifact)
    setShowArtifactPanel(true)
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Chat */}
      <div
        className="flex flex-col min-w-0"
        style={showArtifactPanel ? { flex: '0 0 40%', minWidth: '320px' } : { flex: 1 }}
      >
        {/* Conversation Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
          <div className="relative" ref={conversationDropdownRef}>
            <button
              onClick={() => setShowConversationList(!showConversationList)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-sm"
              style={{ color: 'var(--chat-text)' }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: 'var(--chat-text-secondary)' }} />
              <span className="max-w-[150px] truncate">
                {currentConversation?.title || 'New Chat'}
              </span>
              <ChevronDown className="w-3 h-3" style={{ color: 'var(--chat-text-secondary)' }} />
            </button>

            {/* Conversation dropdown */}
            {showConversationList && (
              <div
                className="absolute top-full left-0 mt-1 w-64 rounded-lg border border-surface-border bg-surface-elevated shadow-xl z-50 overflow-hidden"
              >
                <div className="p-2 border-b border-surface-border">
                  <button
                    onClick={createNewConversation}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors text-sm text-accent"
                  >
                    <Plus className="w-4 h-4" />
                    New Conversation
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm" style={{ color: 'var(--chat-text-secondary)' }}>
                      No saved conversations
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => loadConversation(conv)}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors group',
                          conv.id === currentConversation?.id ? 'bg-accent/10' : 'hover:bg-surface-border/50'
                        )}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--chat-text-secondary)' }} />
                        <span className="flex-1 truncate text-sm" style={{ color: 'var(--chat-text)' }}>
                          {conv.title}
                        </span>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Artifact panel toggle */}
            <button
              onClick={() => setShowArtifactPanel(!showArtifactPanel)}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                showArtifactPanel
                  ? 'bg-accent/20 text-accent'
                  : currentArtifact
                    ? 'bg-accent text-white animate-pulse'
                    : 'hover:bg-surface-elevated'
              )}
              style={{ color: showArtifactPanel || currentArtifact ? undefined : 'var(--chat-text-secondary)' }}
              title={showArtifactPanel ? 'Hide artifact panel' : 'Show artifact panel'}
            >
              <PanelRight className="w-4 h-4" />
            </button>
            <button
              onClick={createNewConversation}
              className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--chat-text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* ChatContainer from the library - this is the core dogfooding */}
        <ChatContainer
          messages={messages}
          isProcessing={isProcessing}
          thinkingText={streamingThinking}
          tasks={currentTasks}
          pendingQuestion={pendingQuestion}
          pendingApproval={pendingApproval}
          diffs={currentDiffs}
          onSend={handleSend}
          onStop={stopProcessing}
          onAnswerQuestion={handleAnswerQuestion}
          onAnswerApproval={handleAnswerApproval}
          onArtifact={handleArtifact}
          suggestions={['analyze', 'code', 'spreadsheet', 'pdf', 'search', 'build', 'image', 'deploy', 'refactor', 'configure']}
          emptyStateLayout="top-input"
          placeholder="Type a message..."
          welcomeMessage={welcomeMessage}
          centered={!showArtifactPanel}
          renderMessageExtras={renderMessageExtras}
          className="flex-1"
        />
      </div>

      {/* Artifact Panel */}
      {showArtifactPanel && (
        <div
          className="border-l border-surface-border bg-surface-elevated"
          style={{ flex: '0 0 60%', minWidth: '300px' }}
        >
          <ArtifactPanel artifact={currentArtifact} onClose={() => setCurrentArtifact(null)} />
        </div>
      )}
    </div>
  )
}

function CodeBlock({ code, language = 'tsx', title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    }).then(result => {
      setHtml(result)
      setIsLoading(false)
    }).catch(() => {
      setHtml(`<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
      setIsLoading(false)
    })
  }, [code, language])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg border border-surface-border overflow-hidden" style={{ background: 'var(--chat-surface)' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border" style={{ background: 'var(--surface-elevated)' }}>
        <span className="text-xs font-mono" style={{ color: 'var(--chat-text-secondary)' }}>{title || language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: 'var(--chat-text-secondary)' }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {isLoading ? (
        <div className="p-4">
          <div className="h-4 rounded w-3/4 mb-2 animate-pulse" style={{ background: 'var(--surface-elevated)' }}></div>
          <div className="h-4 rounded w-1/2 animate-pulse" style={{ background: 'var(--surface-elevated)' }}></div>
        </div>
      ) : (
        <div
          className="p-4 overflow-x-auto text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:!text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}

function HomePage({ onNavigate, theme, onToggleTheme }: { onNavigate: (page: string) => void; theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--surface)' }}>
      <header className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>@vith-ai/chat-ui</span>
          <span className="text-xs hidden sm:block" style={{ color: 'var(--chat-text-secondary)' }}>Model-agnostic chat components</span>
          <span className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--accent)', color: 'white', opacity: 0.9 }}>
            <Sparkles className="w-3 h-3" />
            Agent-ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ background: 'var(--surface-elevated)', color: 'var(--chat-text-secondary)' }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onNavigate('docs')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
            style={{ color: 'var(--chat-text-secondary)' }}
          >
            <BookOpen className="w-4 h-4" />
            Docs
          </button>
          <a
            href="https://github.com/vith-ai/chat-ui"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
            style={{ color: 'var(--chat-text-secondary)' }}
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

function DocsPage({ onNavigate, theme, onToggleTheme }: { onNavigate: (page: string) => void; theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const [activeSection, setActiveSection] = useState('quickstart')

  const sections = [
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'installation', label: 'Installation' },
    { id: 'adapters', label: 'Model Adapters' },
    { id: 'components', label: 'Components' },
    { id: 'hooks', label: 'Hooks' },
    { id: 'conversations', label: 'Conversations' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'customization', label: 'Customization' },
    { id: 'theming', label: 'Theming' },
    { id: 'recipes', label: 'Recipes' },
    { id: 'types', label: 'TypeScript' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl" style={{ borderColor: 'var(--surface-border)', background: 'color-mix(in srgb, var(--surface) 80%, transparent)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--chat-text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Demo
          </button>
          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent)' }}>Documentation</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ background: 'var(--surface-elevated)', color: 'var(--chat-text-secondary)' }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href="https://github.com/vith-ai/chat-ui"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
            style={{ color: 'var(--chat-text-secondary)' }}
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
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
                      : 'text-[color:var(--chat-text-secondary)] hover:text-[color:var(--chat-text)] hover:bg-surface-elevated'
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
          {activeSection === 'conversations' && <ConversationsSection />}
          {activeSection === 'artifacts' && <ArtifactsSection />}
          {activeSection === 'permissions' && <PermissionsSection />}
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
        <p className="text-[color:var(--chat-text-secondary)]">Get a working chat UI in under 5 minutes.</p>
      </div>

      <div className="p-4 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="font-semibold text-sm">Built for AI agents</span>
        </div>
        <p className="text-sm text-[color:var(--chat-text-secondary)] mb-2">
          Using Claude Code, Cursor, or another AI coding assistant? Point it to our condensed docs:
        </p>
        <a
          href="/llms.txt"
          target="_blank"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors"
          style={{ background: 'var(--surface-elevated)', color: 'var(--accent)' }}
        >
          /llms.txt
        </a>
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
              <span className="text-[color:var(--chat-text-secondary)]">— {p.desc}</span>
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
        <p className="text-[color:var(--chat-text-secondary)]">Install the package and configure your project.</p>
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
        <p className="text-[color:var(--chat-text-secondary)]">Connect to any LLM provider.</p>
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
        <p className="text-[color:var(--chat-text-secondary)]">All available components and props.</p>
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
        <p className="text-[color:var(--chat-text-secondary)]">React hooks for chat state.</p>
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

function ConversationsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Conversation Management</h1>
        <p className="text-[color:var(--chat-text-secondary)]">Manage multiple conversations with persistence.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">useConversations Hook</h2>
        <CodeBlock code={`import { useConversations, useChat } from '@vith-ai/chat-ui'

function ChatApp() {
  const conversations = useConversations()
  const chat = useChat({ adapter })

  return (
    <div className="flex">
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
      <ChatContainer messages={chat.messages} onSend={chat.sendMessage} />
    </div>
  )
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Custom Storage Backend</h2>
        <p className="text-sm text-[color:var(--chat-text-secondary)] mb-3">
          By default, conversations are stored in localStorage. For production, implement a custom store.
        </p>
        <CodeBlock code={`import type { ConversationStore } from '@vith-ai/chat-ui'

// Example: Supabase backend
const supabaseStore: ConversationStore = {
  async list() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
    return data
  },
  async get(id) { /* ... */ },
  async create(title) { /* ... */ },
  async update(id, updates) { /* ... */ },
  async delete(id) { /* ... */ },
}

const conversations = useConversations({ store: supabaseStore })`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Stores</h2>
        <div className="grid gap-2 text-sm">
          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <code className="text-accent">createLocalStorageStore(key?)</code>
            <p className="text-[color:var(--chat-text-secondary)] mt-1">Browser localStorage (default)</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <code className="text-accent">createMemoryStore()</code>
            <p className="text-[color:var(--chat-text-secondary)] mt-1">In-memory (SSR/testing)</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border">
            <code className="text-accent">ConversationStore</code>
            <p className="text-[color:var(--chat-text-secondary)] mt-1">Interface for custom backends</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ArtifactsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Artifact System</h1>
        <p className="text-[color:var(--chat-text-secondary)]">Display rich content with pluggable renderers. Easily add support for any content type.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Start</h2>
        <CodeBlock code={`import { ArtifactRegistry } from '@vith-ai/chat-ui'

// Create a registry
const registry = new ArtifactRegistry()

// Register ANY custom renderer
registry.register({
  types: ['my-custom-type'],
  render: (artifact) => <MyCustomComponent data={artifact.content} />,
})

// Use it
if (registry.canRender(artifact)) {
  return registry.render(artifact)
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Built-in Types</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {['code', 'markdown', 'image', 'html', 'csv', 'json', 'pdf', 'spreadsheet', 'custom'].map(type => (
            <div key={type} className="p-2 rounded-lg bg-surface-elevated border border-surface-border">
              <code className="text-accent">{type}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Example: Code with Syntax Highlighting</h2>
        <CodeBlock code={`// npm install shiki
import { codeToHtml } from 'shiki'

registry.register({
  types: ['code'],
  render: (artifact) => {
    const [html, setHtml] = useState('')

    useEffect(() => {
      codeToHtml(artifact.content, {
        lang: artifact.language || 'text',
        theme: 'github-dark',
      }).then(setHtml)
    }, [artifact])

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  },
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Example: Spreadsheets (Univer)</h2>
        <p className="text-sm text-[color:var(--chat-text-secondary)] mb-2">
          Univer is fully open source (Apache 2.0) with Excel-like features.
        </p>
        <CodeBlock code={`// npm install @univerjs/presets @univerjs/preset-sheets-core
import { createUniver, defaultTheme, LocaleType } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import '@univerjs/presets/lib/styles/preset-sheets-core.css'

registry.register({
  types: ['spreadsheet', 'csv'],
  render: (artifact) => {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (!containerRef.current) return

      const { univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        theme: defaultTheme,
        presets: [UniverSheetsCorePreset()],
      })

      univerAPI.createWorkbook({ sheets: [{ data: parseCSV(artifact.content) }] })

      return () => univerAPI.dispose()
    }, [artifact])

    return <div ref={containerRef} style={{ height: 400 }} />
  },
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Example: Diagrams (Mermaid)</h2>
        <CodeBlock code={`// npm install mermaid
import mermaid from 'mermaid'

registry.register({
  types: ['custom'],
  canRender: (artifact) => artifact.metadata?.format === 'mermaid',
  render: (artifact) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (ref.current) {
        mermaid.render('diagram', artifact.content).then(({ svg }) => {
          ref.current!.innerHTML = svg
        })
      }
    }, [artifact])

    return <div ref={ref} />
  },
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Example: PDF Viewer</h2>
        <CodeBlock code={`// npm install react-pdf
import { Document, Page } from 'react-pdf'

registry.register({
  types: ['pdf'],
  render: (artifact) => (
    <Document file={artifact.content}>
      <Page pageNumber={1} />
    </Document>
  ),
})`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Optional Dependencies</h2>
        <p className="text-sm text-[color:var(--chat-text-secondary)] mb-3">
          All fully open source (MIT/Apache 2.0). Install only what you need:
        </p>
        <CodeBlock code={`# Syntax highlighting (MIT)
npm install shiki

# Markdown (MIT)
npm install react-markdown remark-gfm

# Spreadsheets (Apache 2.0) - recommended
npm install @univerjs/presets @univerjs/preset-sheets-core

# Excel file parsing (Apache 2.0)
npm install xlsx exceljs

# PDFs (MIT)
npm install react-pdf

# Word documents (BSD-2)
npm install mammoth

# Diagrams (MIT)
npm install mermaid`} language="bash" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Creating Artifacts</h2>
        <CodeBlock code={`import { createArtifact, detectArtifactType } from '@vith-ai/chat-ui'

// Explicit type
const codeArtifact = createArtifact(code, {
  title: 'Button.tsx',
  type: 'code',
  language: 'typescript',
})

// Auto-detect from filename
const artifact = createArtifact(content, {
  filename: 'data.csv',  // Detects as 'csv'
})

// Supported types:
// 'code' | 'markdown' | 'image' | 'html' | 'csv' |
// 'json' | 'pdf' | 'spreadsheet' | 'custom'`} />
      </div>
    </div>
  )
}

function PermissionsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Permission System</h1>
        <p className="text-[color:var(--chat-text-secondary)]">Configure approval flows for sensitive tool operations.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Permission Levels</h2>
        <div className="grid gap-2 text-sm">
          {[
            { level: 'auto', desc: 'Execute immediately, no notification', color: 'text-emerald-400' },
            { level: 'notify', desc: 'Execute immediately, show notification', color: 'text-blue-400' },
            { level: 'confirm', desc: 'Show ApprovalCard, wait for user approval', color: 'text-amber-400' },
            { level: 'deny', desc: 'Never execute, return error', color: 'text-red-400' },
          ].map(({ level, desc, color }) => (
            <div key={level} className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
              <code className={color}>{level}</code>
              <span className="text-[color:var(--chat-text-secondary)]">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tool Registry</h2>
        <CodeBlock code={`import { createToolRegistry, commonTools } from '@vith-ai/chat-ui'

// Start with common tools (read_file, write_file, run_shell, etc.)
const registry = createToolRegistry(commonTools)

// Register custom tools
registry.register({
  name: 'deploy_production',
  description: 'Deploy to production servers',
  permission: 'confirm',
  risk: 'high',
  categories: ['deployment'],
})

// Check permissions
if (registry.requiresConfirmation('write_file')) {
  // Show ApprovalCard
}

// Update permissions at runtime
registry.setPermission('read_file', 'auto')`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Permission Presets</h2>
        <CodeBlock code={`import { permissionPresets } from '@vith-ai/chat-ui'

// Available presets:
permissionPresets.permissive  // Allow all (dev/testing)
permissionPresets.standard    // Confirm writes, auto reads
permissionPresets.strict      // Confirm everything
permissionPresets.noExecution // Deny code/shell execution

// Use in config
const config = {
  ...permissionPresets.standard,
  toolPermissions: {
    'delete_file': 'deny',  // Override specific tools
  },
}`} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Handling Approvals</h2>
        <CodeBlock code={`function handleToolCall(toolCall) {
  const permission = registry.getPermission(toolCall.name)

  if (permission === 'deny') {
    return { error: 'Action not allowed' }
  }

  if (permission === 'confirm') {
    setPendingApproval({
      id: toolCall.id,
      action: toolCall.name,
      risk: 'high',
      details: JSON.stringify(toolCall.input),
    })
    return // Wait for user
  }

  return executeToolCall(toolCall)
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
        <p className="text-[color:var(--chat-text-secondary)]">Customize avatars, tools, and behavior.</p>
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
        <p className="text-sm text-[color:var(--chat-text-secondary)] mb-3">
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
        <p className="text-sm text-[color:var(--chat-text-secondary)] mt-3">
          Common configurations:
        </p>
        <div className="grid gap-2 text-sm mt-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="font-mono text-accent">40/60</span>
            <span className="text-[color:var(--chat-text-secondary)]">— Default (like Vith)</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="font-mono text-accent">50/50</span>
            <span className="text-[color:var(--chat-text-secondary)]">— Equal split</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-elevated border border-surface-border">
            <span className="font-mono text-accent">30/70</span>
            <span className="text-[color:var(--chat-text-secondary)]">— Code-focused</span>
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
        <p className="text-[color:var(--chat-text-secondary)]">Customize colors and appearance.</p>
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
        <p className="text-[color:var(--chat-text-secondary)]">Common patterns and integrations.</p>
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
        <p className="text-[color:var(--chat-text-secondary)]">Type definitions.</p>
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Apply theme class to document (matches library's .chat-theme-light)
  useEffect(() => {
    document.documentElement.classList.toggle('chat-theme-light', theme === 'light')
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <>
      {page === 'home' && <HomePage onNavigate={setPage} theme={theme} onToggleTheme={toggleTheme} />}
      {page === 'docs' && <DocsPage onNavigate={setPage} theme={theme} onToggleTheme={toggleTheme} />}
    </>
  )
}
