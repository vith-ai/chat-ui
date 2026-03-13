import { Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import type { TabStatus } from '../types'

export interface Tab {
  /** Unique tab identifier */
  id: string
  /** Display label */
  label: string
  /** Current status */
  status: TabStatus
}

export interface TabBarProps {
  /** List of tabs */
  tabs: Tab[]
  /** Currently active tab ID */
  activeTabId: string
  /** Called when a tab is clicked */
  onSelectTab: (tabId: string) => void
  /** Called when a tab's close button is clicked */
  onCloseTab?: (tabId: string) => void
  /** Called when the new tab button is clicked */
  onNewTab?: () => void
  /** Maximum number of tabs allowed (default: 5) */
  maxTabs?: number
  /** Custom class name */
  className?: string
}

const STATUS_ICONS: Record<TabStatus, typeof Loader2> = {
  idle: CheckCircle2,
  running: Loader2,
  needs_input: AlertCircle,
  done: CheckCircle2,
}

export function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  maxTabs = 5,
  className,
}: TabBarProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-1 px-2 py-1.5 border-b border-[var(--chat-border)] bg-[var(--chat-bg)] overflow-x-auto',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const StatusIcon = STATUS_ICONS[tab.status]
        const isAttention = !isActive && tab.status === 'needs_input'
        const isDone = !isActive && tab.status === 'done'

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={clsx(
              'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-w-0 max-w-[180px]',
              isActive
                ? 'bg-[var(--chat-surface)] text-[var(--chat-text)] border border-[var(--chat-border)]'
                : 'text-[var(--chat-text-secondary)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-surface)]/50'
            )}
          >
            <StatusIcon
              className={clsx(
                'w-3.5 h-3.5 flex-shrink-0',
                tab.status === 'running' && 'chat-animate-spin',
                (isAttention || isDone) && 'chat-tab-attention',
                tab.status === 'idle' && !isActive && 'opacity-40',
                tab.status === 'needs_input' && 'text-[var(--chat-warning)]',
                tab.status === 'done' && 'text-[var(--chat-success)]',
                tab.status === 'running' && 'text-[var(--chat-accent)]',
              )}
            />
            <span className="truncate">{tab.label}</span>

            {/* Close button */}
            {onCloseTab && tabs.length > 1 && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className={clsx(
                  'flex-shrink-0 w-4 h-4 flex items-center justify-center rounded',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'hover:bg-[var(--chat-border)] text-[var(--chat-text-secondary)]'
                )}
              >
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        )
      })}

      {/* New tab button */}
      {onNewTab && tabs.length < maxTabs && (
        <button
          onClick={onNewTab}
          className={clsx(
            'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg',
            'text-[var(--chat-text-secondary)] hover:text-[var(--chat-text)]',
            'hover:bg-[var(--chat-surface)] transition-colors'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export default TabBar
