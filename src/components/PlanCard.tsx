import { ClipboardList, Check, X, MessageSquare, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import type { PendingPlan } from '../types'

export interface PlanCardProps {
  plan: PendingPlan
  /** Called when the plan is approved */
  onApprove?: () => void
  /** Called when the plan is rejected, optionally with feedback */
  onReject?: (feedback?: string) => void
  /** Custom class name */
  className?: string
  /** Disable buttons */
  disabled?: boolean
}

export function PlanCard({
  plan,
  onApprove,
  onReject,
  className,
  disabled = false,
}: PlanCardProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')

  const handleRejectWithFeedback = () => {
    onReject?.(feedback.trim() || undefined)
    setShowFeedback(false)
    setFeedback('')
  }

  return (
    <div
      className={clsx(
        'chat-animate-fade-in rounded-lg border border-[var(--chat-accent)]/30 bg-[var(--chat-accent)]/5 overflow-hidden',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--chat-accent)]/10">
            <ClipboardList className="w-5 h-5 text-[var(--chat-accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[var(--chat-accent)] uppercase tracking-wide">
              Proposed Plan
            </span>
            <p className="text-sm font-medium text-[var(--chat-text)] mt-1">{plan.title}</p>
            {plan.summary && (
              <p className="text-xs text-[var(--chat-text-secondary)] mt-1">{plan.summary}</p>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="mt-4 space-y-1.5">
          {plan.steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--chat-surface)] border border-[var(--chat-border)]"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--chat-accent)]/10 text-[var(--chat-accent)] text-xs font-medium flex items-center justify-center mt-0.5">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--chat-text)]">{step.title}</div>
                {step.description && (
                  <div className="text-xs text-[var(--chat-text-secondary)] mt-0.5">
                    {step.description}
                  </div>
                )}
                {step.toolName && (
                  <div className="flex items-center gap-1 mt-1">
                    <ChevronRight className="w-3 h-3 text-[var(--chat-text-secondary)]" />
                    <span className="text-xs font-mono text-[var(--chat-text-secondary)]">
                      {step.toolName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback input */}
      {showFeedback && (
        <div className="px-4 pb-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What would you like to change?"
            disabled={disabled}
            rows={2}
            className={clsx(
              'w-full px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)]',
              'text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-text-secondary)]',
              'focus:outline-none focus:border-[var(--chat-accent)] resize-none',
              'disabled:opacity-50'
            )}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleRejectWithFeedback}
              disabled={disabled}
              className={clsx(
                'flex-1 py-2 rounded-lg text-sm font-medium',
                'bg-[var(--chat-warning)] text-white',
                'hover:bg-[var(--chat-warning)]/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Send Feedback
            </button>
            <button
              onClick={() => { setShowFeedback(false); setFeedback('') }}
              disabled={disabled}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'bg-[var(--chat-surface)] text-[var(--chat-text-secondary)]',
                'hover:bg-[var(--chat-border)] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!showFeedback && (
        <div className="flex gap-3 p-4 pt-0">
          <button
            onClick={() => onReject?.()}
            disabled={disabled}
            className={clsx(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm',
              'bg-[var(--chat-error)]/10 text-[var(--chat-error)] border border-[var(--chat-error)]/30',
              'hover:bg-[var(--chat-error)]/20 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            disabled={disabled}
            className={clsx(
              'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm',
              'bg-[var(--chat-warning)]/10 text-[var(--chat-warning)] border border-[var(--chat-warning)]/30',
              'hover:bg-[var(--chat-warning)]/20 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Change
          </button>
          <button
            onClick={onApprove}
            disabled={disabled}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm',
              'bg-[var(--chat-success)] text-white',
              'hover:bg-[var(--chat-success)]/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Check className="w-4 h-4" />
            Approve
          </button>
        </div>
      )}
    </div>
  )
}

export default PlanCard
