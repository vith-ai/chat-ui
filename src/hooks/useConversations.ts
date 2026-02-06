import { useState, useCallback, useEffect } from 'react'
import type { Conversation, ConversationStore, ChatMessage } from '../types'
import { generateId } from '../utils'

/**
 * Built-in localStorage-based conversation store
 * For production, implement ConversationStore with your backend
 */
export function createLocalStorageStore(key = 'chat-conversations'): ConversationStore {
  return {
    async list() {
      const data = localStorage.getItem(key)
      if (!data) return []
      const conversations = JSON.parse(data) as Conversation[]
      return conversations.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }))
    },

    async get(id) {
      const conversations = await this.list()
      return conversations.find(c => c.id === id) || null
    },

    async create(title) {
      const conversations = await this.list()
      const newConversation: Conversation = {
        id: generateId(),
        title: title || 'New conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      conversations.unshift(newConversation)
      localStorage.setItem(key, JSON.stringify(conversations))
      return newConversation
    },

    async update(id, updates) {
      const conversations = await this.list()
      const index = conversations.findIndex(c => c.id === id)
      if (index === -1) throw new Error(`Conversation ${id} not found`)

      conversations[index] = {
        ...conversations[index],
        ...updates,
        updatedAt: new Date(),
      }
      localStorage.setItem(key, JSON.stringify(conversations))
      return conversations[index]
    },

    async delete(id) {
      const conversations = await this.list()
      const filtered = conversations.filter(c => c.id !== id)
      localStorage.setItem(key, JSON.stringify(filtered))
    },
  }
}

/**
 * In-memory conversation store (for testing or SSR)
 */
export function createMemoryStore(): ConversationStore {
  let conversations: Conversation[] = []

  return {
    async list() {
      return [...conversations]
    },

    async get(id) {
      return conversations.find(c => c.id === id) || null
    },

    async create(title) {
      const newConversation: Conversation = {
        id: generateId(),
        title: title || 'New conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      conversations.unshift(newConversation)
      return newConversation
    },

    async update(id, updates) {
      const index = conversations.findIndex(c => c.id === id)
      if (index === -1) throw new Error(`Conversation ${id} not found`)

      conversations[index] = {
        ...conversations[index],
        ...updates,
        updatedAt: new Date(),
      }
      return conversations[index]
    },

    async delete(id) {
      conversations = conversations.filter(c => c.id !== id)
    },
  }
}

export interface UseConversationsOptions {
  /** Custom store implementation (defaults to localStorage) */
  store?: ConversationStore
  /** Auto-generate title from first message */
  autoTitle?: boolean
  /** Maximum title length */
  maxTitleLength?: number
}

export interface UseConversationsReturn {
  /** All conversations */
  conversations: Conversation[]
  /** Currently active conversation */
  currentConversation: Conversation | null
  /** Loading state */
  isLoading: boolean
  /** Create a new conversation */
  createConversation: (title?: string) => Promise<Conversation>
  /** Switch to a conversation */
  selectConversation: (id: string) => Promise<void>
  /** Update current conversation's messages */
  updateMessages: (messages: ChatMessage[]) => Promise<void>
  /** Rename a conversation */
  renameConversation: (id: string, title: string) => Promise<void>
  /** Delete a conversation */
  deleteConversation: (id: string) => Promise<void>
  /** Refresh conversations from store */
  refresh: () => Promise<void>
}

const defaultStore = typeof window !== 'undefined'
  ? createLocalStorageStore()
  : createMemoryStore()

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const {
    store = defaultStore,
    autoTitle = true,
    maxTitleLength = 50,
  } = options

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentConversation = conversations.find(c => c.id === currentId) || null

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await store.list()
      setConversations(list)
    } finally {
      setIsLoading(false)
    }
  }, [store])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createConversation = useCallback(async (title?: string) => {
    const conversation = await store.create(title)
    setConversations(prev => [conversation, ...prev])
    setCurrentId(conversation.id)
    return conversation
  }, [store])

  const selectConversation = useCallback(async (id: string) => {
    const conversation = await store.get(id)
    if (conversation) {
      setCurrentId(id)
    }
  }, [store])

  const updateMessages = useCallback(async (messages: ChatMessage[]) => {
    if (!currentId) return

    let title: string | undefined
    if (autoTitle && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        title = firstUserMessage.content.slice(0, maxTitleLength)
        if (firstUserMessage.content.length > maxTitleLength) {
          title += '...'
        }
      }
    }

    const updated = await store.update(currentId, {
      messages,
      ...(title ? { title } : {}),
    })
    setConversations(prev => prev.map(c => c.id === currentId ? updated : c))
  }, [currentId, store, autoTitle, maxTitleLength])

  const renameConversation = useCallback(async (id: string, title: string) => {
    const updated = await store.update(id, { title })
    setConversations(prev => prev.map(c => c.id === id ? updated : c))
  }, [store])

  const deleteConversation = useCallback(async (id: string) => {
    await store.delete(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentId === id) {
      setCurrentId(null)
    }
  }, [store, currentId])

  return {
    conversations,
    currentConversation,
    isLoading,
    createConversation,
    selectConversation,
    updateMessages,
    renameConversation,
    deleteConversation,
    refresh,
  }
}
