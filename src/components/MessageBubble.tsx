import { User, Bot } from 'lucide-react'
import { clsx } from 'clsx'
import type { ChatMessage } from '../types'
import { renderMarkdown } from '../utils/markdown'

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

  // Render message content using the shared markdown renderer
  const renderContent = (content: string) => {
    if (!content) return null
    return <div className="chat-md-content">{renderMarkdown(content)}</div>
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
