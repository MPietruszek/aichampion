import { apiFetch } from './client'
import { getMockConversations, ALL_MOCK_CONVERSATIONS, getCurrentUserId } from './mock'
import type { Conversation } from '../types'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export const listConversations = (): Promise<Conversation[]> =>
  DEMO ? Promise.resolve(getMockConversations()) : apiFetch<Conversation[]>('/conversations')

export const createConversation = (file: File): Promise<Conversation> => {
  if (DEMO) {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ''),
      file_name: file.name,
      file_type: file.name.endsWith('.pdf') ? 'pdf' : 'docx',
      file_size: file.size,
      indexed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    ALL_MOCK_CONVERSATIONS.unshift({ ...newConv, user_id: getCurrentUserId() })
    return new Promise((r) => setTimeout(() => r(newConv), 1200))
  }
  const form = new FormData()
  form.append('file', file)
  return apiFetch<Conversation>('/conversations', { method: 'POST', body: form, headers: {} })
}

export const renameConversation = (id: string, title: string): Promise<Conversation> => {
  if (DEMO) {
    const conv = ALL_MOCK_CONVERSATIONS.find((c) => c.id === id)!
    conv.title = title
    return Promise.resolve({ ...conv })
  }
  return apiFetch<Conversation>(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export const deleteConversation = (id: string): Promise<void> => {
  if (DEMO) {
    const idx = ALL_MOCK_CONVERSATIONS.findIndex((c) => c.id === id)
    if (idx !== -1) ALL_MOCK_CONVERSATIONS.splice(idx, 1)
    return Promise.resolve()
  }
  return apiFetch<void>(`/conversations/${id}`, { method: 'DELETE' })
}
