import { Loader2, Square } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useRef, useEffect } from 'react'

export interface AgentStatusSpinnerProps {
  /** Current status text (e.g., "Calling API...", "Running analyze_data...") */
  status?: string
  /** Called when the user clicks Stop */
  onStop?: () => void
  /** Seconds after which elapsed time is shown (default: 5) */
  showElapsedAfter?: number
  /** Seconds after which the spinner shows warning state (default: 30) */
  warnAfter?: number
  /** Custom class name */
  className?: string
}

export function AgentStatusSpinner({
  status,
  onStop,
  showElapsedAfter = 5,
  warnAfter = 30,
  className,
}: AgentStatusSpinnerProps) {
  const [elapsed, setElapsed] = useState(0)
  const mountTime = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - mountTime.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const isStale = elapsed > warnAfter

  return (
    <div
      className={clsx(
        'chat-animate-fade-in flex items-center gap-2 px-4 py-3',
        className
      )}
    >
      <Loader2
        className={clsx(
          'w-4 h-4 chat-animate-spin flex-shrink-0',
          isStale ? 'text-[var(--chat-warning)]' : 'text-[var(--chat-accent)]'
        )}
      />
      <span
        className={clsx(
          'text-sm',
          isStale ? 'text-[var(--chat-warning)]' : 'text-[var(--chat-text-secondary)]'
        )}
      >
        {status || 'Thinking...'}
        {elapsed >= showElapsedAfter && (
          <span className="ml-1.5 opacity-70">({elapsed}s)</span>
        )}
      </span>
      {isStale && onStop && (
        <button
          onClick={onStop}
          className={clsx(
            'ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
            'bg-[var(--chat-warning)]/10 text-[var(--chat-warning)] border border-[var(--chat-warning)]/30',
            'hover:bg-[var(--chat-warning)]/20 transition-colors'
          )}
        >
          <Square className="w-3 h-3" />
          Stop
        </button>
      )}
    </div>
  )
}

export default AgentStatusSpinner
