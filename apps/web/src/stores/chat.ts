import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatHit } from '@rag-playground/shared'
import { streamChat } from '../services/chat-sse'

/**
 * UI 層的訊息型別——比 shared 的 ChatMessage 多了引用來源、串流狀態、錯誤。
 */
export interface ChatUIMessage {
  role: 'user' | 'assistant'
  content: string
  hits?: ChatHit[]
  error?: string
  streaming?: boolean
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatUIMessage[]>([])
  const isStreaming = ref(false)

  async function ask(query: string) {
    const q = query.trim()
    if (!q || isStreaming.value) return

    messages.value.push({ role: 'user', content: q })
    const idx = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: '',
      streaming: true,
    })
    isStreaming.value = true

    // 透過 index 寫回，確保經過 Vue 的 reactive proxy 觸發 re-render
    const update = (patch: Partial<ChatUIMessage>) => {
      messages.value[idx] = { ...messages.value[idx]!, ...patch }
    }

    try {
      await streamChat(q, {
        onMeta: (e) => update({ hits: e.hits }),
        onText: (e) => {
          const cur = messages.value[idx]!
          update({ content: cur.content + e.text })
        },
        onError: (e) => update({ error: e.message }),
      })
    } catch (err) {
      update({ error: err instanceof Error ? err.message : String(err) })
    } finally {
      update({ streaming: false })
      isStreaming.value = false
    }
  }

  function clearMessages() {
    messages.value = []
  }

  return { messages, isStreaming, ask, clearMessages }
})
