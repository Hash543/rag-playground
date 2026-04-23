<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useChatStore } from './stores/chat'

const chatStore = useChatStore()
const input = ref('')
const chatAreaRef = ref<HTMLElement | null>(null)

async function handleSend() {
  const text = input.value.trim()
  if (!text || chatStore.isStreaming) return
  input.value = ''
  await chatStore.ask(text)
}

// 訊息或內容更新時自動捲到底
watch(
  () => chatStore.messages.map((m) => m.content).join('|'),
  async () => {
    await nextTick()
    const el = chatAreaRef.value
    if (el) el.scrollTop = el.scrollHeight
  },
)
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎮 D2R 攻略助理</h1>
      <button
        v-if="chatStore.messages.length > 0"
        class="clear-btn"
        :disabled="chatStore.isStreaming"
        @click="chatStore.clearMessages"
      >
        清除
      </button>
    </header>

    <main ref="chatAreaRef" class="chat-area">
      <div
        v-for="(msg, i) in chatStore.messages"
        :key="i"
        :class="['message', msg.role]"
      >
        <span class="role">{{ msg.role === 'user' ? '你' : '助理' }}</span>

        <p class="content">{{ msg.content
          }}<span v-if="msg.streaming" class="cursor">▍</span>
        </p>

        <div v-if="msg.error" class="error">⚠ {{ msg.error }}</div>

        <details
          v-if="msg.hits && msg.hits.length > 0"
          class="citations"
          open
        >
          <summary>📚 引用 {{ msg.hits.length }} 筆</summary>
          <ul>
            <li v-for="hit in msg.hits" :key="hit.id">
              <span class="sim">{{ hit.similarity.toFixed(2) }}</span>
              <span class="title">{{ hit.title }}</span>
              <span class="src">{{ hit.source }}#{{ hit.chunkIndex }}</span>
            </li>
          </ul>
        </details>
      </div>

      <div v-if="chatStore.messages.length === 0" class="empty">
        輸入你的 Diablo 2 問題開始對話（例：「完美紅寶石怎麼合成」）
      </div>
    </main>

    <footer class="input-area">
      <input
        v-model="input"
        placeholder="輸入問題..."
        :disabled="chatStore.isStreaming"
        @keyup.enter="handleSend"
      />
      <button
        :disabled="chatStore.isStreaming || !input.trim()"
        @click="handleSend"
      >
        {{ chatStore.isStreaming ? '...' : '送出' }}
      </button>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: system-ui, sans-serif;
}

.header {
  padding: 1rem;
  background: #1a1a2e;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid #555;
  border-radius: 6px;
  background: transparent;
  color: #ccc;
  cursor: pointer;
  font-size: 0.85rem;
}
.clear-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #16213e;
}

.message {
  margin-bottom: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #0f3460;
  color: #e0e0e0;
  margin-left: auto;
}

.message.assistant {
  background: #533483;
  color: #e0e0e0;
}

.role {
  font-size: 0.75rem;
  opacity: 0.7;
}

.content {
  white-space: pre-wrap;
  margin-top: 0.25rem;
  line-height: 1.5;
}

.cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}
@keyframes blink {
  50% { opacity: 0; }
}

.error {
  margin-top: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background: rgba(233, 69, 96, 0.2);
  color: #ffb4b4;
  font-size: 0.85rem;
}

.citations {
  margin-top: 0.6rem;
  font-size: 0.85rem;
}
.citations summary {
  cursor: pointer;
  opacity: 0.8;
}
.citations ul {
  margin-top: 0.4rem;
  padding-left: 0.5rem;
  list-style: none;
}
.citations li {
  padding: 0.2rem 0;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.citations .sim {
  font-variant-numeric: tabular-nums;
  background: rgba(0, 0, 0, 0.25);
  padding: 0 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
}
.citations .title {
  font-weight: 500;
}
.citations .src {
  opacity: 0.6;
  font-size: 0.75rem;
}

.empty {
  text-align: center;
  color: #888;
  margin-top: 2rem;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: #1a1a2e;
}

.input-area input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f3460;
  color: #e0e0e0;
  font-size: 1rem;
}
.input-area input:disabled {
  opacity: 0.5;
}

.input-area button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #e94560;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}
.input-area button:hover:not(:disabled) {
  background: #c73e54;
}
.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
