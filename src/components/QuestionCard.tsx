import { HelpCircle, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import type { PendingQuestion, QuestionOption } from '../types'

export interface QuestionCardProps {
  question: PendingQuestion
  /** Called when an option is selected */
  onAnswer?: (answer: string | string[]) => void
  /** Custom class name */
  className?: string
  /** Disable selection */
  disabled?: boolean
}

export function QuestionCard({
  question,
  onAnswer,
  className,
  disabled = false,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleSelect = (option: QuestionOption) => {
    if (disabled) return

    const value = option.value ?? option.label

    if (question.multiSelect) {
      const newSelected = new Set(selected)
      if (newSelected.has(value)) {
        newSelected.delete(value)
      } else {
        newSelected.add(value)
      }
      setSelected(newSelected)
    } else {
      onAnswer?.(value)
    }
  }

  const handleSubmitMulti = () => {
    if (selected.size > 0) {
      onAnswer?.(Array.from(selected))
    }
  }

  const handleSubmitCustom = () => {
    if (customInput.trim()) {
      onAnswer?.(customInput.trim())
    }
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
            <HelpCircle className="w-5 h-5 text-[var(--chat-accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            {question.header && (
              <span className="text-xs font-medium text-[var(--chat-accent)] uppercase tracking-wide">
                {question.header}
              </span>
            )}
            <p className="text-sm text-[var(--chat-text)] mt-1">{question.question}</p>
          </div>
        </div>

        {/* Options */}
        <div className="mt-4 space-y-2">
          {question.options.map((option, index) => {
            const value = option.value ?? option.label
            const isSelected = selected.has(value)

            return (
              <button
                key={index}
                onClick={() => handleSelect(option)}
                disabled={disabled}
                className={clsx(
                  'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
                  isSelected
                    ? 'border-[var(--chat-accent)] bg-[var(--chat-accent)]/10'
                    : 'border-[var(--chat-border)] bg-[var(--chat-surface)] hover:border-[var(--chat-accent)]/50',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {question.multiSelect && (
                  <div
                    className={clsx(
                      'flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mt-0.5',
                      isSelected
                        ? 'border-[var(--chat-accent)] bg-[var(--chat-accent)]'
                        : 'border-[var(--chat-border)]'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--chat-text)]">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-[var(--chat-text-secondary)] mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </button>
            )
          })}

          {/* Custom input option */}
          <button
            onClick={() => setShowCustom(!showCustom)}
            disabled={disabled}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
              showCustom
                ? 'border-[var(--chat-accent)] bg-[var(--chat-accent)]/10'
                : 'border-[var(--chat-border)] bg-[var(--chat-surface)] hover:border-[var(--chat-accent)]/50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span className="text-sm text-[var(--chat-text-secondary)]">Other...</span>
          </button>

          {showCustom && (
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type your answer..."
                disabled={disabled}
                className={clsx(
                  'flex-1 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)]',
                  'text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-text-secondary)]',
                  'focus:outline-none focus:border-[var(--chat-accent)]',
                  'disabled:opacity-50'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitCustom()
                  }
                }}
              />
              <button
                onClick={handleSubmitCustom}
                disabled={disabled || !customInput.trim()}
                className={clsx(
                  'px-4 py-2 rounded-lg bg-[var(--chat-accent)] text-white text-sm font-medium',
                  'hover:bg-[var(--chat-accent-hover)] transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multi-select submit */}
      {question.multiSelect && selected.size > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={handleSubmitMulti}
            disabled={disabled}
            className={clsx(
              'w-full py-2.5 rounded-lg bg-[var(--chat-accent)] text-white text-sm font-medium',
              'hover:bg-[var(--chat-accent-hover)] transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Confirm Selection ({selected.size})
          </button>
        </div>
      )}
    </div>
  )
}

export default QuestionCard
