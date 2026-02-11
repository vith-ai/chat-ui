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
  /** Current messages (includes streaming message during processing) */
  messages: ChatMessage[]
  /** Whether currently processing */
  isProcessing: boolean
  /** Current thinking text (streaming) */
  thinkingText: string
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
  /** Replace all messages (for loading conversations) or update with function */
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const { initialMessages = [], adapter, onSend, onResponse, onError } = options

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isProcessing, setIsProcessing] = useState(false)
  const [thinkingText, setThinkingText] = useState('')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setTasks([])
    setPendingQuestion(null)
    setThinkingText('')
    streamingMessageIdRef.current = null
  }, [])

  const replaceMessages = useCallback((newMessages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof newMessages === 'function') {
      setMessages(newMessages)
    } else {
      setMessages(newMessages)
      setTasks([])
      setPendingQuestion(null)
      setThinkingText('')
      streamingMessageIdRef.current = null
    }
  }, [])

  const stopProcessing = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsProcessing(false)
    // Remove streaming message if we stop mid-stream
    if (streamingMessageIdRef.current) {
      setMessages((prev) => prev.filter((m) => m.id !== streamingMessageIdRef.current))
      streamingMessageIdRef.current = null
    }
  }, [])

  // Helper to update the streaming message in-place
  const updateStreamingMessage = useCallback(
    (updater: (msg: ChatMessage) => ChatMessage) => {
      const streamingId = streamingMessageIdRef.current
      if (!streamingId) return

      setMessages((prev) =>
        prev.map((msg) => (msg.id === streamingId ? updater(msg) : msg))
      )
    },
    []
  )

  // Helper to create or get the streaming message
  const ensureStreamingMessage = useCallback(() => {
    if (streamingMessageIdRef.current) return

    const streamingMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      metadata: { isStreaming: true },
    }
    streamingMessageIdRef.current = streamingMessage.id
    setMessages((prev) => [...prev, streamingMessage])
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
      setThinkingText('')
      streamingMessageIdRef.current = null
      abortControllerRef.current = new AbortController()

      try {
        const allMessages = [...messages, userMessage]

        const response = await adapter.sendMessage(allMessages, {
          signal: abortControllerRef.current.signal,
          onStream: (chunk) => {
            ensureStreamingMessage()
            updateStreamingMessage((msg) => ({
              ...msg,
              content: msg.content + chunk,
            }))
          },
          onThinking: (thinking) => {
            setThinkingText(thinking)
            ensureStreamingMessage()
            updateStreamingMessage((msg) => ({
              ...msg,
              thinking,
            }))
          },
          onToolCall: (toolCall) => {
            ensureStreamingMessage()
            updateStreamingMessage((msg) => {
              const existingCalls = msg.toolCalls || []
              const existingIndex = existingCalls.findIndex((tc) => tc.id === toolCall.id)

              let updatedCalls: ToolCall[]
              if (existingIndex >= 0) {
                // Update existing tool call
                updatedCalls = [...existingCalls]
                updatedCalls[existingIndex] = toolCall
              } else {
                // Add new tool call
                updatedCalls = [...existingCalls, toolCall]
              }

              return { ...msg, toolCalls: updatedCalls }
            })
          },
        })

        // Replace streaming message with final response
        // Capture ref value before state update - React processes updates async
        // and the ref would be null by the time the updater runs
        const streamingId = streamingMessageIdRef.current
        if (streamingId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingId
                ? { ...response, id: msg.id } // Keep the same ID for React key stability
                : msg
            )
          )
        } else {
          // No streaming happened, just add the response
          addMessage(response)
        }

        onResponse?.(response)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError?.(error as Error)
          // Remove streaming message on error
          // Capture ref value before state update
          const streamingId = streamingMessageIdRef.current
          if (streamingId) {
            setMessages((prev) => prev.filter((m) => m.id !== streamingId))
          }
        }
      } finally {
        setIsProcessing(false)
        setThinkingText('')
        streamingMessageIdRef.current = null
        abortControllerRef.current = null
      }
    },
    [adapter, messages, addMessage, onSend, onResponse, onError, ensureStreamingMessage, updateStreamingMessage]
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
    thinkingText,
    tasks,
    pendingQuestion,
    sendMessage,
    stopProcessing,
    answerQuestion,
    addMessage,
    setTasks,
    setPendingQuestion,
    clearMessages,
    setMessages: replaceMessages,
  }
}
