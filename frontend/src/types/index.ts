export interface Conversation {
  id: string
  title: string
  file_name: string
  file_type: 'pdf' | 'docx'
  file_size: number
  indexed: boolean
  created_at: string
  updated_at: string
}

export interface Source {
  paragraph: string
  title?: string
  text: string
  score: number
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  created_at: string
}

export type SSEEvent =
  | { type: 'token'; content: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface SlashCommand {
  name: string
  label: string
  description: string
  hint: string
}
