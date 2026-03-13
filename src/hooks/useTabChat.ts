import { useReducer, useCallback, useRef, useEffect } from 'react'
import type {
  ChatMessage,
  ChatAdapter,
  TaskItem,
  PendingQuestion,
  ApprovalRequest,
  PendingPlan,
  FileChange,
  Artifact,
  TabState,
  TabStatus,
  ConversationStore,
  ToolCall,
  ToolResult,
  ToolExecutor,
  ToolRegistry,
  PermissionConfig,
} from '../types'
import { generateId } from '../utils'
import { getEffectivePermission } from '../permissions'

// ============ State Types ============

interface TabsState {
  tabs: TabState[]
  activeTabId: string
}

// ============ Actions ============

type TabAction =
  | { type: 'ADD_TAB'; tab: TabState }
  | { type: 'REMOVE_TAB'; tabId: string }
  | { type: 'SET_ACTIVE_TAB'; tabId: string }
  | { type: 'SET_TAB_LABEL'; tabId: string; label: string }
  | { type: 'SET_TAB_CONVERSATION'; tabId: string; conversationId: string | null }
  | { type: 'SET_MESSAGES'; tabId: string; messages: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; tabId: string; message: ChatMessage }
  | { type: 'UPSERT_MESSAGE'; tabId: string; message: ChatMessage }
  | { type: 'SET_PROCESSING'; tabId: string; isProcessing: boolean }
  | { type: 'SET_THINKING'; tabId: string; text: string; duration?: number | null }
  | { type: 'SET_AGENT_STATUS'; tabId: string; status: string | null }
  | { type: 'SET_TASKS'; tabId: string; tasks: TaskItem[] }
  | { type: 'UPSERT_TASK'; tabId: string; task: TaskItem }
  | { type: 'ADD_PENDING_APPROVAL'; tabId: string; approval: ApprovalRequest }
  | { type: 'REMOVE_PENDING_APPROVAL'; tabId: string; approvalId: string }
  | { type: 'ADD_PENDING_QUESTION'; tabId: string; question: PendingQuestion }
  | { type: 'REMOVE_PENDING_QUESTION'; tabId: string; questionId: string }
  | { type: 'ADD_PENDING_PLAN'; tabId: string; plan: PendingPlan }
  | { type: 'REMOVE_PENDING_PLAN'; tabId: string; planId: string }
  | { type: 'SET_DIFFS'; tabId: string; diffs: FileChange[] }
  | { type: 'ADD_DIFF'; tabId: string; diff: FileChange }
  | { type: 'SET_ARTIFACTS'; tabId: string; artifacts: Artifact[] }
  | { type: 'ADD_ARTIFACT'; tabId: string; artifact: Artifact }
  | { type: 'SET_ERROR'; tabId: string; error: Error | null }
  | { type: 'MARK_TAB_DONE'; tabId: string }
  | { type: 'RESET_TAB'; tabId: string }

// ============ Status Computation ============

function computeTabStatus(tab: TabState): TabStatus {
  if (tab.pendingApprovals.length > 0 || tab.pendingQuestions.length > 0 || tab.pendingPlans.length > 0) {
    return 'needs_input'
  }
  if (tab.isProcessing) return 'running'
  if (tab.completedInBackground) return 'done'
  return 'idle'
}

function updateTab(state: TabsState, tabId: string, updater: (tab: TabState) => TabState): TabsState {
  const tabs = state.tabs.map((t) => {
    if (t.id !== tabId) return t
    const updated = updater(t)
    return { ...updated, status: computeTabStatus(updated) }
  })
  return { ...state, tabs }
}

// ============ Reducer ============

function tabsReducer(state: TabsState, action: TabAction): TabsState {
  switch (action.type) {
    case 'ADD_TAB':
      return { ...state, tabs: [...state.tabs, { ...action.tab, status: computeTabStatus(action.tab) }] }

    case 'REMOVE_TAB': {
      const tabs = state.tabs.filter((t) => t.id !== action.tabId)
      const activeTabId = state.activeTabId === action.tabId
        ? (tabs[tabs.length - 1]?.id ?? '')
        : state.activeTabId
      return { ...state, tabs, activeTabId }
    }

    case 'SET_ACTIVE_TAB':
      return updateTab(
        { ...state, activeTabId: action.tabId },
        action.tabId,
        (tab) => ({ ...tab, completedInBackground: false })
      )

    case 'SET_TAB_LABEL':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, label: action.label }))

    case 'SET_TAB_CONVERSATION':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, conversationId: action.conversationId }))

    case 'SET_MESSAGES':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, messages: action.messages }))

    case 'ADD_MESSAGE':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        messages: [...tab.messages, action.message],
      }))

    case 'UPSERT_MESSAGE':
      return updateTab(state, action.tabId, (tab) => {
        const idx = tab.messages.findIndex((m) => m.id === action.message.id)
        if (idx >= 0) {
          const messages = [...tab.messages]
          messages[idx] = action.message
          return { ...tab, messages }
        }
        return { ...tab, messages: [...tab.messages, action.message] }
      })

    case 'SET_PROCESSING':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, isProcessing: action.isProcessing }))

    case 'SET_THINKING':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        thinkingText: action.text,
        thinkingDuration: action.duration !== undefined ? action.duration : tab.thinkingDuration,
      }))

    case 'SET_AGENT_STATUS':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, agentStatus: action.status }))

    case 'SET_TASKS':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, tasks: action.tasks }))

    case 'UPSERT_TASK':
      return updateTab(state, action.tabId, (tab) => {
        const idx = tab.tasks.findIndex((t) => t.id === action.task.id)
        if (idx >= 0) {
          const tasks = [...tab.tasks]
          tasks[idx] = action.task
          return { ...tab, tasks }
        }
        return { ...tab, tasks: [...tab.tasks, action.task] }
      })

    case 'ADD_PENDING_APPROVAL':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        pendingApprovals: [...tab.pendingApprovals, action.approval],
      }))

    case 'REMOVE_PENDING_APPROVAL':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        pendingApprovals: tab.pendingApprovals.filter((a) => a.id !== action.approvalId),
      }))

    case 'ADD_PENDING_QUESTION':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        pendingQuestions: [...tab.pendingQuestions, action.question],
      }))

    case 'REMOVE_PENDING_QUESTION':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        pendingQuestions: tab.pendingQuestions.filter((q) => q.id !== action.questionId),
      }))

    case 'ADD_PENDING_PLAN':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        pendingPlans: [...tab.pendingPlans, action.plan],
      }))

    case 'REMOVE_PENDING_PLAN':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        pendingPlans: tab.pendingPlans.filter((p) => p.id !== action.planId),
      }))

    case 'SET_DIFFS':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, diffs: action.diffs }))

    case 'ADD_DIFF':
      return updateTab(state, action.tabId, (tab) => {
        const idx = tab.diffs.findIndex((d) => d.path === action.diff.path)
        if (idx >= 0) {
          const diffs = [...tab.diffs]
          diffs[idx] = action.diff
          return { ...tab, diffs }
        }
        return { ...tab, diffs: [...tab.diffs, action.diff] }
      })

    case 'SET_ARTIFACTS':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, artifacts: action.artifacts }))

    case 'ADD_ARTIFACT':
      return updateTab(state, action.tabId, (tab) => {
        const idx = tab.artifacts.findIndex((a) => a.id === action.artifact.id)
        if (idx >= 0) {
          const artifacts = [...tab.artifacts]
          artifacts[idx] = action.artifact
          return { ...tab, artifacts }
        }
        return { ...tab, artifacts: [...tab.artifacts, action.artifact] }
      })

    case 'SET_ERROR':
      return updateTab(state, action.tabId, (tab) => ({ ...tab, error: action.error }))

    case 'MARK_TAB_DONE':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        isProcessing: false,
        completedInBackground: state.activeTabId !== action.tabId,
      }))

    case 'RESET_TAB':
      return updateTab(state, action.tabId, (tab) => ({
        ...tab,
        messages: [],
        conversationId: null,
        isProcessing: false,
        pendingApprovals: [],
        pendingQuestions: [],
        pendingPlans: [],
        thinkingText: '',
        thinkingDuration: null,
        agentStatus: null,
        tasks: [],
        diffs: [],
        artifacts: [],
        error: null,
        completedInBackground: false,
      }))

    default:
      return state
  }
}

// ============ Hook ============

function createEmptyTab(label = 'New Chat'): TabState {
  return {
    id: generateId(),
    label,
    status: 'idle',
    messages: [],
    conversationId: null,
    isProcessing: false,
    pendingApprovals: [],
    pendingQuestions: [],
    pendingPlans: [],
    thinkingText: '',
    thinkingDuration: null,
    agentStatus: null,
    tasks: [],
    diffs: [],
    artifacts: [],
    error: null,
    completedInBackground: false,
  }
}

export interface UseTabChatOptions {
  /** Chat adapter */
  adapter?: ChatAdapter
  /** Conversation store for persistence */
  conversationStore?: ConversationStore
  /** Maximum number of tabs (default: 5) */
  maxTabs?: number
  /** Auto-generate title from first message (default: true) */
  autoTitle?: boolean
  /** Maximum title length (default: 30) */
  maxTitleLength?: number
  /** Tool executor */
  toolExecutor?: ToolExecutor
  /** Tool registry for permissions */
  toolRegistry?: ToolRegistry
  /** Permission config */
  permissionConfig?: PermissionConfig
  /** Called when a message is sent */
  onSend?: (tabId: string, message: ChatMessage) => void
  /** Called when a response is received */
  onResponse?: (tabId: string, message: ChatMessage) => void
  /** Called on error */
  onError?: (tabId: string, error: Error) => void
}

export interface UseTabChatReturn {
  /** All tab states */
  tabs: TabState[]
  /** Currently active tab ID */
  activeTabId: string
  /** Currently active tab state */
  activeTab: TabState | undefined
  /** Adapter feature flags */
  adapterFeatures: { streaming: boolean; thinking: boolean; toolUse: boolean } | null
  /** Create a new tab */
  createTab: (label?: string) => string
  /** Close a tab */
  closeTab: (tabId: string) => void
  /** Switch to a tab */
  selectTab: (tabId: string) => void
  /** Send a message in the active tab (or specified tab) */
  sendMessage: (content: string, tabId?: string) => Promise<void>
  /** Stop processing in a tab */
  stopProcessing: (tabId?: string) => void
  /** Answer a pending question */
  answerQuestion: (questionId: string, answer: string | string[], tabId?: string) => void
  /** Answer a pending approval */
  answerApproval: (approvalId: string, approved: boolean, tabId?: string) => void
  /** Answer a pending plan */
  answerPlan: (planId: string, approved: boolean, feedback?: string, tabId?: string) => void
  /** Dispatch raw action (for advanced usage) */
  dispatch: React.Dispatch<TabAction>
}

export function useTabChat(options: UseTabChatOptions = {}): UseTabChatReturn {
  const {
    adapter,
    // conversationStore is available for future tab-level persistence
    maxTabs = 5,
    autoTitle = true,
    maxTitleLength = 30,
    toolExecutor: userToolExecutor,
    toolRegistry,
    permissionConfig,
    onSend,
    onResponse,
    onError,
  } = options

  const initialTab = createEmptyTab()
  const [state, dispatch] = useReducer(tabsReducer, {
    tabs: [initialTab],
    activeTabId: initialTab.id,
  })

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Abort controllers per tab
  const abortControllersRef = useRef(new Map<string, AbortController>())
  // Approval resolvers per tab → per approval ID
  const approvalResolversRef = useRef(new Map<string, Map<string, (approved: boolean) => void>>())
  // Question resolvers per tab
  const questionResolversRef = useRef(new Map<string, Map<string, (answer: string | string[]) => void>>())
  // Plan resolvers per tab
  const planResolversRef = useRef(new Map<string, Map<string, (response: { approved: boolean; feedback?: string }) => void>>())
  // Streaming message IDs per tab
  const streamingMsgRef = useRef(new Map<string, string>())

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId)

  const createTab = useCallback((label?: string): string => {
    if (stateRef.current.tabs.length >= maxTabs) {
      return stateRef.current.activeTabId
    }
    const tab = createEmptyTab(label)
    dispatch({ type: 'ADD_TAB', tab })
    dispatch({ type: 'SET_ACTIVE_TAB', tabId: tab.id })
    return tab.id
  }, [maxTabs])

  const closeTab = useCallback((tabId: string) => {
    // Abort if processing
    abortControllersRef.current.get(tabId)?.abort()
    abortControllersRef.current.delete(tabId)
    dispatch({ type: 'REMOVE_TAB', tabId })
  }, [])

  const selectTab = useCallback((tabId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tabId })
  }, [])

  const stopProcessing = useCallback((tabId?: string) => {
    const id = tabId || stateRef.current.activeTabId
    abortControllersRef.current.get(id)?.abort()
    abortControllersRef.current.delete(id)
    dispatch({ type: 'SET_PROCESSING', tabId: id, isProcessing: false })
    dispatch({ type: 'SET_THINKING', tabId: id, text: '', duration: null })
    dispatch({ type: 'SET_AGENT_STATUS', tabId: id, status: null })
    // Remove streaming message
    const streamingId = streamingMsgRef.current.get(id)
    if (streamingId) {
      const tab = stateRef.current.tabs.find((t) => t.id === id)
      if (tab) {
        dispatch({ type: 'SET_MESSAGES', tabId: id, messages: tab.messages.filter((m) => m.id !== streamingId) })
      }
      streamingMsgRef.current.delete(id)
    }
  }, [])

  // Permission-aware tool executor
  const createToolExecutor = useCallback((tabId: string): ToolExecutor | undefined => {
    if (!userToolExecutor) return undefined
    return async (toolCall: ToolCall): Promise<ToolResult> => {
      const config = permissionConfig || { defaultPermission: 'confirm' as const }
      const toolDef = toolRegistry?.tools.find((t) => t.name === toolCall.name)
      const permission = getEffectivePermission(toolCall.name, toolDef, config)

      if (permission === 'deny') {
        return { toolCallId: toolCall.id, result: `Tool "${toolCall.name}" is not allowed`, isError: true }
      }

      if (permission === 'confirm') {
        const approved = await new Promise<boolean>((resolve) => {
          if (!approvalResolversRef.current.has(tabId)) {
            approvalResolversRef.current.set(tabId, new Map())
          }
          approvalResolversRef.current.get(tabId)!.set(toolCall.id, resolve)
          dispatch({
            type: 'ADD_PENDING_APPROVAL',
            tabId,
            approval: {
              id: toolCall.id,
              action: toolCall.name,
              risk: toolDef?.risk || 'medium',
              details: JSON.stringify(toolCall.input, null, 2),
            },
          })
        })
        if (!approved) {
          return { toolCallId: toolCall.id, result: `User denied "${toolCall.name}"`, isError: true }
        }
      }

      return userToolExecutor(toolCall)
    }
  }, [userToolExecutor, toolRegistry, permissionConfig])

  const sendMessage = useCallback(async (content: string, tabId?: string) => {
    const id = tabId || stateRef.current.activeTabId
    const tab = stateRef.current.tabs.find((t) => t.id === id)
    if (!tab) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    dispatch({ type: 'ADD_MESSAGE', tabId: id, message: userMessage })
    onSend?.(id, userMessage)

    // Auto-label from first message
    if (autoTitle && tab.messages.length === 0) {
      const label = content.slice(0, maxTitleLength) + (content.length > maxTitleLength ? '...' : '')
      dispatch({ type: 'SET_TAB_LABEL', tabId: id, label })
    }

    if (!adapter) return

    dispatch({ type: 'SET_PROCESSING', tabId: id, isProcessing: true })
    dispatch({ type: 'SET_THINKING', tabId: id, text: '', duration: null })
    dispatch({ type: 'SET_ERROR', tabId: id, error: null })
    dispatch({ type: 'SET_AGENT_STATUS', tabId: id, status: null })

    const abortController = new AbortController()
    abortControllersRef.current.set(id, abortController)

    const thinkingStartRef = { current: 0 }
    let streamingMsgId: string | null = null

    const ensureStreamingMsg = () => {
      if (streamingMsgId) return streamingMsgId
      streamingMsgId = generateId()
      streamingMsgRef.current.set(id, streamingMsgId)
      const msg: ChatMessage = {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        metadata: { isStreaming: true },
      }
      dispatch({ type: 'ADD_MESSAGE', tabId: id, message: msg })
      return streamingMsgId
    }

    const updateStreamingMsg = (updates: Partial<ChatMessage>) => {
      if (!streamingMsgId) return
      const currentTab = stateRef.current.tabs.find((t) => t.id === id)
      const current = currentTab?.messages.find((m) => m.id === streamingMsgId)
      if (current) {
        dispatch({ type: 'UPSERT_MESSAGE', tabId: id, message: { ...current, ...updates } })
      }
    }

    try {
      const allMessages = [...tab.messages, userMessage]

      const response = await adapter.sendMessage(allMessages, {
        signal: abortController.signal,
        toolExecutor: createToolExecutor(id),
        onStream: (chunk) => {
          ensureStreamingMsg()
          const currentTab = stateRef.current.tabs.find((t) => t.id === id)
          const current = currentTab?.messages.find((m) => m.id === streamingMsgId)
          updateStreamingMsg({ content: (current?.content || '') + chunk })
        },
        onThinking: (thinking) => {
          if (!thinkingStartRef.current) thinkingStartRef.current = Date.now()
          const duration = Math.floor((Date.now() - thinkingStartRef.current) / 1000)
          dispatch({ type: 'SET_THINKING', tabId: id, text: thinking, duration })
          ensureStreamingMsg()
          updateStreamingMsg({ thinking })
        },
        onToolCall: (toolCall) => {
          ensureStreamingMsg()
          const currentTab = stateRef.current.tabs.find((t) => t.id === id)
          const current = currentTab?.messages.find((m) => m.id === streamingMsgId)
          const existing = current?.toolCalls || []
          const idx = existing.findIndex((tc) => tc.id === toolCall.id)
          const updatedCalls = idx >= 0
            ? existing.map((tc, i) => i === idx ? toolCall : tc)
            : [...existing, toolCall]
          updateStreamingMsg({ toolCalls: updatedCalls })
        },
        onAgentStatus: (status) => {
          dispatch({ type: 'SET_AGENT_STATUS', tabId: id, status })
        },
        onQuestion: (question) => {
          dispatch({ type: 'ADD_PENDING_QUESTION', tabId: id, question })
        },
        onApproval: (approval) => {
          dispatch({ type: 'ADD_PENDING_APPROVAL', tabId: id, approval })
        },
        onPlan: (plan) => {
          dispatch({ type: 'ADD_PENDING_PLAN', tabId: id, plan })
        },
        onTask: (task) => {
          dispatch({ type: 'UPSERT_TASK', tabId: id, task })
        },
        onDiff: (diff) => {
          dispatch({ type: 'ADD_DIFF', tabId: id, diff })
        },
        onArtifact: (artifact) => {
          dispatch({ type: 'ADD_ARTIFACT', tabId: id, artifact })
        },
      })

      // Replace streaming message with final
      if (streamingMsgId) {
        dispatch({ type: 'UPSERT_MESSAGE', tabId: id, message: { ...response, id: streamingMsgId } })
      } else {
        dispatch({ type: 'ADD_MESSAGE', tabId: id, message: response })
      }

      // Compute thinking duration
      if (thinkingStartRef.current) {
        const duration = Math.floor((Date.now() - thinkingStartRef.current) / 1000)
        dispatch({ type: 'SET_THINKING', tabId: id, text: '', duration })
      }

      onResponse?.(id, response)
      dispatch({ type: 'MARK_TAB_DONE', tabId: id })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const err = error as Error
        dispatch({ type: 'SET_ERROR', tabId: id, error: err })
        onError?.(id, err)
        // Remove streaming message on error
        if (streamingMsgId) {
          const currentTab = stateRef.current.tabs.find((t) => t.id === id)
          if (currentTab) {
            dispatch({ type: 'SET_MESSAGES', tabId: id, messages: currentTab.messages.filter((m) => m.id !== streamingMsgId) })
          }
        }
      }
      dispatch({ type: 'SET_PROCESSING', tabId: id, isProcessing: false })
    } finally {
      dispatch({ type: 'SET_THINKING', tabId: id, text: '' })
      dispatch({ type: 'SET_AGENT_STATUS', tabId: id, status: null })
      streamingMsgRef.current.delete(id)
      abortControllersRef.current.delete(id)
    }
  }, [adapter, autoTitle, maxTitleLength, createToolExecutor, onSend, onResponse, onError])

  const answerApproval = useCallback((approvalId: string, approved: boolean, tabId?: string) => {
    const id = tabId || stateRef.current.activeTabId
    const resolver = approvalResolversRef.current.get(id)?.get(approvalId)
    if (resolver) {
      resolver(approved)
      approvalResolversRef.current.get(id)!.delete(approvalId)
    }
    dispatch({ type: 'REMOVE_PENDING_APPROVAL', tabId: id, approvalId })
  }, [])

  const answerQuestion = useCallback((questionId: string, answer: string | string[], tabId?: string) => {
    const id = tabId || stateRef.current.activeTabId
    const resolver = questionResolversRef.current.get(id)?.get(questionId)
    if (resolver) {
      resolver(answer)
      questionResolversRef.current.get(id)!.delete(questionId)
    }
    dispatch({ type: 'REMOVE_PENDING_QUESTION', tabId: id, questionId })
    // Also send as a user message
    const answerText = Array.isArray(answer) ? answer.join(', ') : answer
    sendMessage(answerText, id)
  }, [sendMessage])

  const answerPlan = useCallback((planId: string, approved: boolean, feedback?: string, tabId?: string) => {
    const id = tabId || stateRef.current.activeTabId
    const resolver = planResolversRef.current.get(id)?.get(planId)
    if (resolver) {
      resolver({ approved, feedback })
      planResolversRef.current.get(id)!.delete(planId)
    }
    dispatch({ type: 'REMOVE_PENDING_PLAN', tabId: id, planId })
    if (!approved && feedback) {
      sendMessage(feedback, id)
    } else if (approved) {
      sendMessage('Approved', id)
    }
  }, [sendMessage])

  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    activeTab,
    adapterFeatures: adapter?.features || null,
    createTab,
    closeTab,
    selectTab,
    sendMessage,
    stopProcessing,
    answerQuestion,
    answerApproval,
    answerPlan,
    dispatch,
  }
}
