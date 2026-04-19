<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from './stores/chat'

const chatStore = useChatStore()
const input = ref('')

function handleSend() {
  const text = input.value.trim()
  if (!text) return
  chatStore.addMessage({ role: 'user', content: text })
  input.value = ''
  // TODO: 呼叫 API 取得回覆
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎮 D2R 攻略助理</h1>
    </header>

    <main class="chat-area">
      <div
        v-for="(msg, i) in chatStore.messages"
        :key="i"
        :class="['message', msg.role]"
      >
        <span class="role">{{ msg.role === 'user' ? '你' : '助理' }}</span>
        <p>{{ msg.content }}</p>
      </div>
      <div v-if="chatStore.messages.length === 0" class="empty">
        輸入你的 Diablo 2 問題開始對話
      </div>
    </main>

    <footer class="input-area">
      <input
        v-model="input"
        placeholder="輸入問題..."
        @keyup.enter="handleSend"
      />
      <button @click="handleSend">送出</button>
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
  text-align: center;
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

.input-area button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #e94560;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

.input-area button:hover {
  background: #c73e54;
}
</style>
