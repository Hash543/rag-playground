# Architecture

## 概覽

RAG (Retrieval-Augmented Generation) 架構：

```
使用者 → Vue 3 前端 → Fastify API → Embedding (Voyage AI)
                                   → 向量搜尋 (pgvector)
                                   → LLM 回答 (Claude)
```

## 資料流

1. **文件匯入**：原始文件 → 切塊 → Voyage AI 產生 embedding → 存入 pgvector
2. **查詢**：使用者問題 → embedding → pgvector 相似搜尋 → 取出相關 chunks → 組合 prompt → Claude 回答

## 技術選型理由

- **Voyage AI (voyage-3)**：1024 維度，檢索品質優異
- **pgvector**：用熟悉的 PostgreSQL，不需額外學習獨立向量資料庫
- **Fastify**：Node.js 最快的 HTTP 框架之一
- **Claude**：Anthropic 的 LLM，擅長長文理解與結構化回答
