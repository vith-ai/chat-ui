import { Send, Square, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef, useEffect } from 'react'
import type {
  ChatMessage,
  TaskItem,
  PendingQuestion,
  ToolCall,
  ChatTheme,
} from '../types'
import { MessageBubble } from './MessageBubble'
import { ThinkingBox } from './ThinkingBox'
import { TodoBox } from './TodoBox'
import { QuestionCard } from './QuestionCard'
import { ToolCallCard } from './ToolCallCard'

export interface ChatContainerProps {
  /** List of messages to display */
  messages: ChatMessage[]
  /** Whether the assistant is currently processing */
  isProcessing?: boolean
  /** Current thinking text (while streaming) */
  thinkingText?: string
  /** Current tasks */
  tasks?: TaskItem[]
  /** Pending question from assistant */
  pendingQuestion?: PendingQuestion
  /** Called when user sends a message */
  onSend?: (message: string) => void
  /** Called when user stops processing */
  onStop?: () => void
  /** Called when user answers a question */
  onAnswerQuestion?: (answer: string | string[]) => void
  /** Custom tool call renderers */
  toolRenderers?: Record<string, (toolCall: ToolCall) => React.ReactNode>
  /** Custom theme */
  theme?: ChatTheme
  /** Placeholder text for input */
  placeholder?: string
  /** Custom class name */
  className?: string
  /** Custom assistant avatar */
  assistantAvatar?: React.ReactNode
  /** Custom user avatar */
  userAvatar?: React.ReactNode
  /** Welcome message when no messages */
  welcomeMessage?: React.ReactNode
}

export function ChatContainer({
  messages,
  isProcessing = false,
  thinkingText,
  tasks,
  pendingQuestion,
  onSend,
  onStop,
  onAnswerQuestion,
  toolRenderers,
  theme,
  placeholder = 'Type a message...',
  className,
  assistantAvatar,
  userAvatar,
  welcomeMessage,
}: ChatContainerProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, thinkingText, pendingQuestion])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    onSend?.(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Apply theme as CSS variables
  const themeStyle = theme
    ? ({
        '--chat-bg': theme.bg,
        '--chat-surface': theme.surface,
        '--chat-border': theme.border,
        '--chat-text': theme.text,
        '--chat-text-secondary': theme.textSecondary,
        '--chat-accent': theme.accent,
        '--chat-accent-hover': theme.accentHover,
        '--chat-success': theme.success,
        '--chat-warning': theme.warning,
        '--chat-error': theme.error,
      } as React.CSSProperties)
    : undefined

  const renderToolCalls = (toolCalls: ToolCall[]) => {
    return (
      <div className="space-y-2">
        {toolCalls.map((tc) =>
          toolRenderers?.[tc.name] ? (
            <div key={tc.id}>{toolRenderers[tc.name](tc)}</div>
          ) : (
            <ToolCallCard key={tc.id} toolCall={tc} />
          )
        )}
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'flex flex-col h-full bg-[var(--chat-bg)] text-[var(--chat-text)]',
        className
      )}
      style={themeStyle}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {messages.length === 0 && welcomeMessage ? (
          <div className="flex items-center justify-center h-full p-8">
            {welcomeMessage}
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                assistantAvatar={assistantAvatar}
                userAvatar={userAvatar}
                renderToolCalls={
                  message.toolCalls?.length ? () => renderToolCalls(message.toolCalls!) : undefined
                }
              />
            ))}

            {/* Thinking box */}
            {thinkingText && (
              <div className="px-4 py-2">
                <ThinkingBox
                  thinking={thinkingText}
                  isStreaming={isProcessing}
                  defaultCollapsed={false}
                />
              </div>
            )}

            {/* Tasks */}
            {tasks && tasks.length > 0 && (
              <div className="px-4 py-2">
                <TodoBox tasks={tasks} />
              </div>
            )}

            {/* Pending question */}
            {pendingQuestion && (
              <div className="px-4 py-2">
                <QuestionCard
                  question={pendingQuestion}
                  onAnswer={onAnswerQuestion}
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && !thinkingText && (
              <div className="flex items-center gap-2 px-4 py-3 text-[var(--chat-text-secondary)]">
                <Loader2 className="w-4 h-4 chat-animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--chat-border)] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            rows={1}
            className={clsx(
              'flex-1 px-4 py-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-surface)]',
              'text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-text-secondary)]',
              'focus:outline-none focus:border-[var(--chat-accent)] resize-none',
              'disabled:opacity-50'
            )}
          />

          {isProcessing ? (
            <button
              type="button"
              onClick={onStop}
              className={clsx(
                'flex-shrink-0 p-3 rounded-xl bg-[var(--chat-error)] text-white',
                'hover:bg-[var(--chat-error)]/80 transition-colors'
              )}
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={clsx(
                'flex-shrink-0 p-3 rounded-xl bg-[var(--chat-accent)] text-white',
                'hover:bg-[var(--chat-accent-hover)] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default ChatContainer
