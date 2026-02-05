import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { TaskItem } from '../types'

export interface TodoBoxProps {
  /** List of tasks */
  tasks: TaskItem[]
  /** Custom class name */
  className?: string
  /** Title for the task list */
  title?: string
  /** Show completed tasks */
  showCompleted?: boolean
}

export function TodoBox({
  tasks,
  className,
  title = 'Tasks',
  showCompleted = true,
}: TodoBoxProps) {
  const visibleTasks = showCompleted ? tasks : tasks.filter((t) => t.status !== 'completed')

  if (visibleTasks.length === 0) return null

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const totalCount = tasks.length

  return (
    <div
      className={clsx(
        'chat-animate-fade-in rounded-lg border border-[var(--chat-border)] bg-[var(--chat-surface)] overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--chat-border)]">
        <span className="text-sm font-medium text-[var(--chat-text)]">{title}</span>
        <span className="text-xs text-[var(--chat-text-secondary)]">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="divide-y divide-[var(--chat-border)]">
        {visibleTasks.map((task) => (
          <div
            key={task.id}
            className={clsx(
              'flex items-start gap-3 px-3 py-2',
              task.status === 'completed' && 'opacity-60'
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {task.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-[var(--chat-success)]" />
              ) : task.status === 'in_progress' ? (
                <Loader2 className="w-4 h-4 text-[var(--chat-accent)] chat-animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--chat-text-secondary)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={clsx(
                  'text-sm',
                  task.status === 'completed'
                    ? 'text-[var(--chat-text-secondary)] line-through'
                    : 'text-[var(--chat-text)]'
                )}
              >
                {task.status === 'in_progress' && task.activeForm
                  ? task.activeForm
                  : task.label}
              </div>
              {task.description && (
                <div className="text-xs text-[var(--chat-text-secondary)] mt-0.5 truncate">
                  {task.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--chat-bg)]">
        <div
          className="h-full bg-[var(--chat-accent)] transition-all duration-300"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default TodoBox
