import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage } from '@rag-playground/shared'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])

  function addMessage(msg: ChatMessage) {
    messages.value.push(msg)
  }

  function clearMessages() {
    messages.value = []
  }

  return { messages, addMessage, clearMessages }
})
