import {
  Wrench,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import type { ToolCall } from '../types'

export interface ToolCallCardProps {
  toolCall: ToolCall
  /** Custom class name */
  className?: string
  /** Custom icon for specific tools */
  icon?: React.ReactNode
  /** Custom renderer for tool input */
  renderInput?: (input: Record<string, unknown>) => React.ReactNode
  /** Custom renderer for tool output */
  renderOutput?: (output: unknown) => React.ReactNode
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string; animate?: boolean }> = {
  pending: {
    icon: Clock,
    color: 'text-[var(--chat-text-secondary)]',
    bgColor: 'bg-[var(--chat-surface)]',
    label: 'Pending',
  },
  running: {
    icon: Loader2,
    color: 'text-[var(--chat-accent)]',
    bgColor: 'bg-[var(--chat-accent)]/10',
    label: 'Running',
    animate: true,
  },
  complete: {
    icon: CheckCircle,
    color: 'text-[var(--chat-success)]',
    bgColor: 'bg-[var(--chat-success)]/10',
    label: 'Complete',
  },
  error: {
    icon: XCircle,
    color: 'text-[var(--chat-error)]',
    bgColor: 'bg-[var(--chat-error)]/10',
    label: 'Error',
  },
}

export function ToolCallCard({
  toolCall,
  className,
  icon,
  renderInput,
  renderOutput,
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = statusConfig[toolCall.status]
  const StatusIcon = config.icon

  const formatJson = (obj: unknown) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  return (
    <div
      className={clsx(
        'chat-animate-fade-in rounded-lg border border-[var(--chat-border)] overflow-hidden',
        config.bgColor,
        className
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--chat-bg)]/50 transition-colors"
      >
        {icon || <Wrench className={clsx('w-4 h-4', config.color)} />}
        <span className="text-sm font-medium text-[var(--chat-text)]">{toolCall.name}</span>
        <StatusIcon
          className={clsx('w-4 h-4 ml-auto', config.color, config.animate && 'chat-animate-spin')}
        />
        {toolCall.duration && (
          <span className="text-xs text-[var(--chat-text-secondary)]">{toolCall.duration}ms</span>
        )}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--chat-text-secondary)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--chat-text-secondary)]" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-[var(--chat-border)] bg-[var(--chat-bg)]">
          {toolCall.input && Object.keys(toolCall.input).length > 0 && (
            <div className="p-3 border-b border-[var(--chat-border)]">
              <div className="text-xs font-medium text-[var(--chat-text-secondary)] mb-2">
                Input
              </div>
              {renderInput ? (
                renderInput(toolCall.input)
              ) : (
                <pre className="chat-code-block text-xs text-[var(--chat-text)] overflow-x-auto">
                  {formatJson(toolCall.input)}
                </pre>
              )}
            </div>
          )}

          {toolCall.status === 'complete' && toolCall.output !== undefined && (
            <div className="p-3">
              <div className="text-xs font-medium text-[var(--chat-text-secondary)] mb-2">
                Output
              </div>
              {renderOutput ? (
                renderOutput(toolCall.output)
              ) : (
                <pre className="chat-code-block text-xs text-[var(--chat-text)] overflow-x-auto max-h-48 chat-scrollbar">
                  {typeof toolCall.output === 'string'
                    ? toolCall.output
                    : formatJson(toolCall.output)}
                </pre>
              )}
            </div>
          )}

          {toolCall.status === 'error' && toolCall.error && (
            <div className="p-3">
              <div className="text-xs font-medium text-[var(--chat-error)] mb-2">Error</div>
              <pre className="chat-code-block text-xs text-[var(--chat-error)]">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ToolCallCard
