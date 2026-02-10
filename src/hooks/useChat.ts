import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, TaskItem, PendingQuestion, ChatAdapter, ToolCall } from '../types'
import { generateId } from '../utils'

export interface UseChatOptions {
  /** Initial messages */
  initialMessages?: ChatMessage[]
  /** Chat adapter for making API calls */
  adapter?: ChatAdapter
  /** Called when a message is sent */
  onSend?: (message: ChatMessage) => void
  /** Called when a response is received */
  onResponse?: (message: ChatMessage) => void
  /** Called on error */
  onError?: (error: Error) => void
}

export interface UseChatReturn {
  /** Current messages */
  messages: ChatMessage[]
  /** Whether currently processing */
  isProcessing: boolean
  /** Current streaming content (before final message) */
  streamingContent: string
  /** Current thinking text (streaming) */
  thinkingText: string
  /** Active tool calls during processing */
  activeToolCalls: ToolCall[]
  /** Current tasks */
  tasks: TaskItem[]
  /** Pending question */
  pendingQuestion: PendingQuestion | null
  /** Send a message */
  sendMessage: (content: string) => Promise<void>
  /** Stop processing */
  stopProcessing: () => void
  /** Answer a pending question */
  answerQuestion: (answer: string | string[]) => void
  /** Add a message directly */
  addMessage: (message: ChatMessage) => void
  /** Update tasks */
  setTasks: (tasks: TaskItem[]) => void
  /** Set pending question */
  setPendingQuestion: (question: PendingQuestion | null) => void
  /** Clear messages */
  clearMessages: () => void
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { initialMessages = [], adapter, onSend, onResponse, onError } = options

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [thinkingText, setThinkingText] = useState('')
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setTasks([])
    setPendingQuestion(null)
    setStreamingContent('')
    setThinkingText('')
    setActiveToolCalls([])
  }, [])

  const stopProcessing = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsProcessing(false)
  }, [])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      addMessage(userMessage)
      onSend?.(userMessage)

      if (!adapter) {
        // No adapter - just add the message
        return
      }

      setIsProcessing(true)
      setStreamingContent('')
      setThinkingText('')
      setActiveToolCalls([])
      abortControllerRef.current = new AbortController()

      try {
        const allMessages = [...messages, userMessage]

        const response = await adapter.sendMessage(allMessages, {
          signal: abortControllerRef.current.signal,
          onStream: (chunk) => {
            setStreamingContent((prev) => prev + chunk)
          },
          onThinking: (thinking) => {
            setThinkingText(thinking)
          },
          onToolCall: (toolCall) => {
            setActiveToolCalls((prev) => {
              const existing = prev.findIndex((tc) => tc.id === toolCall.id)
              if (existing >= 0) {
                // Update existing tool call
                const updated = [...prev]
                updated[existing] = toolCall
                return updated
              }
              // Add new tool call
              return [...prev, toolCall]
            })
          },
        })

        addMessage(response)
        onResponse?.(response)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError?.(error as Error)
        }
      } finally {
        setIsProcessing(false)
        setStreamingContent('')
        setThinkingText('')
        setActiveToolCalls([])
        abortControllerRef.current = null
      }
    },
    [adapter, messages, addMessage, onSend, onResponse, onError]
  )

  const answerQuestion = useCallback(
    (answer: string | string[]) => {
      if (!pendingQuestion) return

      const answerText = Array.isArray(answer) ? answer.join(', ') : answer

      // Add the answer as a user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: answerText,
        timestamp: new Date(),
        metadata: {
          questionId: pendingQuestion.id,
          isQuestionAnswer: true,
        },
      }

      addMessage(userMessage)
      setPendingQuestion(null)

      // If we have an adapter, continue the conversation
      if (adapter) {
        sendMessage(answerText)
      }
    },
    [pendingQuestion, addMessage, adapter, sendMessage]
  )

  return {
    messages,
    isProcessing,
    streamingContent,
    thinkingText,
    activeToolCalls,
    tasks,
    pendingQuestion,
    sendMessage,
    stopProcessing,
    answerQuestion,
    addMessage,
    setTasks,
    setPendingQuestion,
    clearMessages,
  }
}
