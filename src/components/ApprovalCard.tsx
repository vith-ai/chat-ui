import { ShieldAlert, ShieldCheck, AlertTriangle, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { ApprovalRequest } from '../types'

export interface ApprovalCardProps {
  request: ApprovalRequest
  /** Called when approved */
  onApprove?: () => void
  /** Called when denied */
  onDeny?: () => void
  /** Custom class name */
  className?: string
  /** Disable buttons */
  disabled?: boolean
}

const riskConfig = {
  low: {
    icon: ShieldCheck,
    color: 'text-[var(--chat-success)]',
    bgColor: 'bg-[var(--chat-success)]/10',
    borderColor: 'border-[var(--chat-success)]/30',
    label: 'Low Risk',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-[var(--chat-warning)]',
    bgColor: 'bg-[var(--chat-warning)]/10',
    borderColor: 'border-[var(--chat-warning)]/30',
    label: 'Medium Risk',
  },
  high: {
    icon: ShieldAlert,
    color: 'text-[var(--chat-error)]',
    bgColor: 'bg-[var(--chat-error)]/10',
    borderColor: 'border-[var(--chat-error)]/30',
    label: 'High Risk',
  },
}

export function ApprovalCard({
  request,
  onApprove,
  onDeny,
  className,
  disabled = false,
}: ApprovalCardProps) {
  const config = riskConfig[request.risk]
  const RiskIcon = config.icon

  return (
    <div
      className={clsx(
        'chat-animate-fade-in rounded-lg border overflow-hidden',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={clsx('flex-shrink-0 p-2 rounded-lg', config.bgColor)}>
            <RiskIcon className={clsx('w-5 h-5', config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-[var(--chat-text)]">
                Permission Required
              </span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full', config.bgColor, config.color)}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-[var(--chat-text)]">{request.action}</p>
            {request.details && (
              <p className="text-xs text-[var(--chat-text-secondary)] mt-1">{request.details}</p>
            )}
          </div>
        </div>

        {request.code && (
          <div className="mt-3 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)] overflow-hidden">
            <pre className="chat-code-block p-3 text-xs text-[var(--chat-text)] overflow-x-auto">
              {request.code}
            </pre>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 pt-0">
        <button
          onClick={onDeny}
          disabled={disabled}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium',
            'bg-[var(--chat-error)]/10 text-[var(--chat-error)] border border-[var(--chat-error)]/30',
            'hover:bg-[var(--chat-error)]/20 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <X className="w-4 h-4" />
          Deny
        </button>
        <button
          onClick={onApprove}
          disabled={disabled}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium',
            'bg-[var(--chat-success)] text-white',
            'hover:bg-[var(--chat-success)]/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
      </div>
    </div>
  )
}

export default ApprovalCard
