import { apiFetch, apiStream } from './client'
import { MOCK_MESSAGES, mockStreamMessage } from './mock'
import type { Message, SSEEvent } from '../types'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export const listMessages = (conversationId: string): Promise<Message[]> =>
  DEMO
    ? Promise.resolve(MOCK_MESSAGES[conversationId] ?? [])
    : apiFetch<Message[]>(`/conversations/${conversationId}/messages`)

export async function* streamMessage(
  conversationId: string,
  content: string,
  command: string | null = null,
): AsyncGenerator<SSEEvent> {
  if (DEMO) {
    yield* mockStreamMessage(content, command)
    return
  }

  const reader = apiStream(`/conversations/${conversationId}/messages`, { content, command })
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6)) as SSEEvent
        } catch { /* skip malformed */ }
      }
    }
  }
}
