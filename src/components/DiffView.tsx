import { FileCode, Plus, Minus, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import { diffLines, type Change } from 'diff'
import type { FileChange } from '../types'

export interface DiffViewProps {
  change: FileChange
  /** Called when approved */
  onApprove?: () => void
  /** Called when rejected */
  onReject?: () => void
  /** Custom class name */
  className?: string
  /** Show approve/reject buttons */
  showActions?: boolean
  /** Disable buttons */
  disabled?: boolean
  /** Max height before scrolling */
  maxHeight?: number
}

export function DiffView({
  change,
  onApprove,
  onReject,
  className,
  showActions = true,
  disabled = false,
  maxHeight = 400,
}: DiffViewProps) {
  const diff: Change[] =
    change.before && change.after
      ? diffLines(change.before, change.after)
      : change.after
        ? [{ value: change.after, added: true }]
        : []

  const stats = diff.reduce(
    (acc, part) => {
      const lines = part.value.split('\n').filter(Boolean).length
      if (part.added) acc.added += lines
      if (part.removed) acc.removed += lines
      return acc
    },
    { added: 0, removed: 0 }
  )

  const typeColors = {
    created: 'text-[var(--chat-success)]',
    modified: 'text-[var(--chat-warning)]',
    deleted: 'text-[var(--chat-error)]',
  }

  const typeLabels = {
    created: 'New File',
    modified: 'Modified',
    deleted: 'Deleted',
  }

  return (
    <div
      className={clsx(
        'chat-animate-fade-in rounded-lg border border-[var(--chat-border)] bg-[var(--chat-surface)] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--chat-border)] bg-[var(--chat-bg)]">
        <FileCode className="w-4 h-4 text-[var(--chat-text-secondary)]" />
        <span className="text-sm font-mono text-[var(--chat-text)] truncate flex-1">
          {change.path}
        </span>
        <span className={clsx('text-xs px-2 py-0.5 rounded', typeColors[change.type])}>
          {typeLabels[change.type]}
        </span>
        {stats.added > 0 && (
          <span className="text-xs text-[var(--chat-success)] flex items-center gap-0.5">
            <Plus className="w-3 h-3" />
            {stats.added}
          </span>
        )}
        {stats.removed > 0 && (
          <span className="text-xs text-[var(--chat-error)] flex items-center gap-0.5">
            <Minus className="w-3 h-3" />
            {stats.removed}
          </span>
        )}
      </div>

      {/* Diff content */}
      <div
        className="overflow-auto chat-scrollbar"
        style={{ maxHeight }}
      >
        <table className="w-full text-xs font-mono">
          <tbody>
            {diff.map((part, partIndex) => {
              const lines = part.value.split('\n')
              // Remove last empty line from split
              if (lines[lines.length - 1] === '') lines.pop()

              return lines.map((line, lineIndex) => (
                <tr
                  key={`${partIndex}-${lineIndex}`}
                  className={clsx(
                    part.added && 'chat-diff-add',
                    part.removed && 'chat-diff-remove',
                    !part.added && !part.removed && 'chat-diff-context'
                  )}
                >
                  <td className="w-4 text-center select-none text-[var(--chat-text-secondary)] border-r border-[var(--chat-border)]">
                    {part.added ? (
                      <Plus className="w-3 h-3 mx-auto text-[var(--chat-success)]" />
                    ) : part.removed ? (
                      <Minus className="w-3 h-3 mx-auto text-[var(--chat-error)]" />
                    ) : null}
                  </td>
                  <td className="px-3 py-0.5 whitespace-pre text-[var(--chat-text)]">
                    {line || ' '}
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      {showActions && (onApprove || onReject) && (
        <div className="flex border-t border-[var(--chat-border)]">
          {onReject && (
            <button
              onClick={onReject}
              disabled={disabled}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
                'text-[var(--chat-error)] hover:bg-[var(--chat-error)]/10 transition-colors',
                'border-r border-[var(--chat-border)]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={disabled}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
                'text-[var(--chat-success)] hover:bg-[var(--chat-success)]/10 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Check className="w-4 h-4" />
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DiffView
