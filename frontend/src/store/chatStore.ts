import { create } from 'zustand'
import type { Conversation, Message, Source, SlashCommand } from '../types'
import * as conversationsApi from '../api/conversations'
import * as messagesApi from '../api/messages'
import { listCommands, STATIC_COMMANDS } from '../api/commands'

interface ChatState {
  conversations: Conversation[]
  activeId: string | null
  messages: Record<string, Message[]>
  commands: SlashCommand[]
  loadingConversations: boolean
  loadingMessages: boolean
  sending: boolean

  loadConversations: () => Promise<void>
  loadCommands: () => Promise<void>
  createConversation: (file: File) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  setActive: (id: string) => Promise<void>
  sendMessage: (content: string, command: string | null) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: {},
  commands: STATIC_COMMANDS,
  loadingConversations: false,
  loadingMessages: false,
  sending: false,

  loadCommands: async () => {
    const commands = await listCommands()
    set({ commands })
  },

  loadConversations: async () => {
    set({ loadingConversations: true })
    const conversations = await conversationsApi.listConversations()
    set({ conversations, loadingConversations: false })
    // Załaduj komendy równolegle
    get().loadCommands()
  },

  createConversation: async (file) => {
    const conv = await conversationsApi.createConversation(file)
    set((s) => ({ conversations: [conv, ...s.conversations] }))
    await get().setActive(conv.id)
  },

  renameConversation: async (id, title) => {
    const updated = await conversationsApi.renameConversation(id, title)
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteConversation: async (id) => {
    await conversationsApi.deleteConversation(id)
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id)
      const activeId = s.activeId === id ? (conversations[0]?.id ?? null) : s.activeId
      return { conversations, activeId }
    })
  },

  setActive: async (id) => {
    set({ activeId: id })
    if (get().messages[id]) return
    set({ loadingMessages: true })
    const msgs = await messagesApi.listMessages(id)
    set((s) => ({ messages: { ...s.messages, [id]: msgs }, loadingMessages: false }))
  },

  sendMessage: async (content, command) => {
    const { activeId } = get()
    if (!activeId) return

    // Treść wyświetlana w bąbelku użytkownika
    const displayContent = command
      ? `/${command}${content ? `: ${content}` : ''}`
      : content

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeId,
      role: 'user',
      content: displayContent,
      created_at: new Date().toISOString(),
    }

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }

    set((s) => ({
      sending: true,
      messages: {
        ...s.messages,
        [activeId]: [...(s.messages[activeId] ?? []), userMsg, assistantMsg],
      },
    }))

    const assistantId = assistantMsg.id
    let sources: Source[] | undefined

    for await (const event of messagesApi.streamMessage(activeId, content, command)) {
      if (event.type === 'token') {
        set((s) => ({
          messages: {
            ...s.messages,
            [activeId]: s.messages[activeId].map((m) =>
              m.id === assistantId ? { ...m, content: m.content + event.content } : m,
            ),
          },
        }))
      } else if (event.type === 'sources') {
        sources = event.sources
      } else if (event.type === 'done') {
        set((s) => ({
          sending: false,
          messages: {
            ...s.messages,
            [activeId]: s.messages[activeId].map((m) =>
              m.id === assistantId ? { ...m, sources } : m,
            ),
          },
        }))
      } else if (event.type === 'error') {
        set((s) => ({
          sending: false,
          messages: {
            ...s.messages,
            [activeId]: s.messages[activeId].map((m) =>
              m.id === assistantId ? { ...m, content: `Błąd: ${event.message}` } : m,
            ),
          },
        }))
      }
    }
  },
}))
