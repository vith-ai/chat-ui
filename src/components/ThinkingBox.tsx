import { Brain, ChevronDown, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect, useRef } from 'react'

export interface ThinkingBoxProps {
  /** The thinking/reasoning text */
  thinking: string
  /** Whether thinking is still streaming */
  isStreaming?: boolean
  /** Duration in seconds (shown as "Thought for Xs" when not streaming) */
  duration?: number
  /** Initially collapsed (default: true, but auto-expands during streaming) */
  defaultCollapsed?: boolean
  /** Custom class name */
  className?: string
  /** Label text */
  label?: string
}

export function ThinkingBox({
  thinking,
  isStreaming = false,
  duration,
  defaultCollapsed = true,
  className,
  label = 'Thinking',
}: ThinkingBoxProps) {
  const [userToggled, setUserToggled] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const wasStreamingRef = useRef(false)

  // Auto-expand while streaming, auto-collapse when done
  useEffect(() => {
    if (userToggled) return

    if (isStreaming) {
      setIsCollapsed(false)
      wasStreamingRef.current = true
    } else if (wasStreamingRef.current) {
      // Streaming just ended - collapse
      setIsCollapsed(true)
      wasStreamingRef.current = false
    }
  }, [isStreaming, userToggled])

  if (!thinking && !isStreaming) return null

  const handleToggle = () => {
    setUserToggled(true)
    setIsCollapsed(!isCollapsed)
  }

  // Show content when expanded
  const showContent = !isCollapsed

  return (
    <div className={clsx('chat-animate-fade-in', className)}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-[var(--chat-text-secondary)]/70 hover:text-[var(--chat-text-secondary)] transition-colors"
      >
        {isStreaming ? (
          <Loader2 className="w-3 h-3 chat-animate-spin text-[var(--chat-accent)]/70" />
        ) : (
          <Brain className="w-3 h-3 text-[var(--chat-accent)]/50" />
        )}
        <span>
          {isStreaming ? `${label}...` : `Thought for ${duration || 0}s`}
        </span>
        <ChevronDown
          className={clsx(
            'w-3 h-3 ml-auto transition-transform',
            isCollapsed && '-rotate-90'
          )}
        />
      </button>
      {showContent && (
        <div className="mt-1.5 pl-[18px] border-l border-[var(--chat-accent)]/15 text-xs text-[var(--chat-text-secondary)]/60 max-h-40 overflow-y-auto chat-scrollbar leading-relaxed whitespace-pre-wrap">
          {thinking}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3 bg-[var(--chat-accent)]/40 chat-animate-pulse ml-0.5 align-text-bottom rounded-sm" />
          )}
        </div>
      )}
    </div>
  )
}

export default ThinkingBox
