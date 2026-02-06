import { Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'

export interface ThinkingBoxProps {
  /** The thinking/reasoning text */
  thinking: string
  /** Whether thinking is still streaming */
  isStreaming?: boolean
  /** Initially collapsed */
  defaultCollapsed?: boolean
  /** Custom class name */
  className?: string
  /** Label text */
  label?: string
}

export function ThinkingBox({
  thinking,
  isStreaming = false,
  defaultCollapsed = true,
  className,
  label = 'Thinking',
}: ThinkingBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  if (!thinking && !isStreaming) return null

  return (
    <div
      className={clsx(
        'chat-animate-fade-in rounded-lg border border-[var(--chat-border)]/50 bg-[var(--chat-surface)]/30 overflow-hidden',
        className
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--chat-surface)]/50 transition-colors"
      >
        <Brain className="w-4 h-4 text-[var(--chat-accent)]" />
        <span className="text-sm font-medium text-[var(--chat-text)]">{label}</span>
        {isStreaming && (
          <span className="chat-animate-pulse text-xs text-[var(--chat-text-secondary)]">
            thinking...
          </span>
        )}
        <div className="ml-auto">
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-[var(--chat-text-secondary)]" />
          ) : (
            <ChevronDown className="w-3 h-3 text-[var(--chat-text-secondary)]" />
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="px-3 pb-2 border-t border-[var(--chat-border)]/50">
          <div className="mt-2 text-xs text-[var(--chat-text-secondary)] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto chat-scrollbar">
            {thinking}
            {isStreaming && <span className="chat-animate-pulse">▊</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default ThinkingBox
