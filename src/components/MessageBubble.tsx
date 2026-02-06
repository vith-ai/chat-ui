import { User, Bot } from 'lucide-react'
import { clsx } from 'clsx'
import DOMPurify from 'dompurify'
import type { ChatMessage } from '../types'

export interface MessageBubbleProps {
  message: ChatMessage
  /** Custom avatar for assistant */
  assistantAvatar?: React.ReactNode
  /** Custom avatar for user */
  userAvatar?: React.ReactNode
  /** Custom class name */
  className?: string
  /** Render tool calls inline */
  renderToolCalls?: (toolCalls: ChatMessage['toolCalls']) => React.ReactNode
}

export function MessageBubble({
  message,
  assistantAvatar,
  userAvatar,
  className,
  renderToolCalls,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const renderContent = (content: string) => {
    if (!content) return null

    // Split by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/)
        if (match) {
          const [, lang, code] = match
          return (
            <div key={index} className="my-2">
              {lang && (
                <div className="text-xs text-[var(--chat-text-secondary)] bg-[var(--chat-bg)] px-3 py-1 rounded-t-lg border-b border-[var(--chat-border)]">
                  {lang}
                </div>
              )}
              <pre
                className={clsx(
                  'chat-code-block p-3 bg-[var(--chat-bg)] overflow-x-auto',
                  lang ? 'rounded-b-lg' : 'rounded-lg'
                )}
              >
                <code className="text-[13px] font-mono text-[var(--chat-text)]">{code.trim()}</code>
              </pre>
            </div>
          )
        }
      }

      return <div key={index}>{renderMarkdown(part)}</div>
    })
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (!line.trim()) {
        elements.push(<div key={i} className="h-2" />)
        continue
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={i} className="text-sm font-semibold text-[var(--chat-text)] mt-3 mb-1">
            {line.slice(4)}
          </h3>
        )
        continue
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={i} className="text-base font-semibold text-[var(--chat-text)] mt-3 mb-1">
            {line.slice(3)}
          </h2>
        )
        continue
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={i} className="text-lg font-bold text-[var(--chat-text)] mt-3 mb-1">
            {line.slice(2)}
          </h1>
        )
        continue
      }

      // List items
      if (line.match(/^[\-\*]\s/)) {
        elements.push(
          <div key={i} className="flex gap-2 my-0.5 ml-1">
            <span className="text-[var(--chat-accent)]">•</span>
            <span>{renderInline(line.slice(2))}</span>
          </div>
        )
        continue
      }

      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1]
        elements.push(
          <div key={i} className="flex gap-2 my-0.5 ml-1">
            <span className="text-[var(--chat-accent)] min-w-[1.25rem]">{num}.</span>
            <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        )
        continue
      }

      // Regular paragraph
      elements.push(
        <p key={i} className="leading-relaxed">
          {renderInline(line)}
        </p>
      )
    }

    return elements
  }

  const renderInline = (text: string) => {
    // Bold
    let processed = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    processed = processed.replace(
      /`([^`]+)`/g,
      '<code class="px-1.5 py-0.5 bg-[var(--chat-bg)] rounded text-[var(--chat-accent)] text-[13px] font-mono">$1</code>'
    )
    // Links
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[var(--chat-accent)] hover:underline" target="_blank" rel="noopener">$1</a>'
    )

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(processed, { ADD_ATTR: ['target', 'rel'] }),
        }}
      />
    )
  }

  return (
    <div
      className={clsx(
        'chat-animate-fade-in flex items-start gap-2 px-3 py-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
          isUser
            ? 'bg-[var(--chat-surface)]'
            : 'bg-[var(--chat-accent)]/20'
        )}
      >
        {isUser ? (
          userAvatar || <User className="w-3 h-3 text-[var(--chat-text-secondary)]" />
        ) : (
          assistantAvatar || <Bot className="w-3 h-3 text-[var(--chat-accent)]" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={clsx(
          isUser ? 'text-right max-w-[85%] ml-auto' : 'text-left max-w-full'
        )}
      >
        <div
          className={clsx(
            'inline-block px-3 py-2 rounded-xl break-words text-sm',
            isUser
              ? 'bg-[var(--chat-accent)] text-white rounded-tr-sm'
              : 'bg-[var(--chat-surface)] text-[var(--chat-text)] rounded-tl-sm'
          )}
        >
          <div className="leading-relaxed">{renderContent(message.content)}</div>

          {message.toolCalls && message.toolCalls.length > 0 && renderToolCalls && (
            <div className="mt-2 pt-2 border-t border-white/20">
              {renderToolCalls(message.toolCalls)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
