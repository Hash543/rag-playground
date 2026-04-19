# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RAG 練習專案（pnpm monorepo）。MVP：Diablo 2 Resurrected 攻略助理。

## Commands

```bash
pnpm install              # 安裝所有 workspace 依賴
pnpm dev                  # 同時啟動前後端 dev server
pnpm dev:api              # 只啟動 Fastify (port 3000)
pnpm dev:web              # 只啟動 Vite (port 5173)
pnpm build                # 全部 workspace build
pnpm lint                 # 全部 workspace type-check
pnpm -F api dev           # 指定 workspace 執行
docker compose -f infra/docker-compose.yml up -d   # 啟動 PostgreSQL + pgvector
```

## Architecture

- **apps/api** — Fastify + TypeScript 後端，使用 tsx 做 dev server
- **apps/web** — Vue 3 + Vite + Pinia 前端，proxy `/api` → localhost:3000
- **packages/shared** — 共用 TypeScript 型別（ChatMessage, HealthResponse 等）
- **infra/** — Docker Compose (Postgres 16 + pgvector), init.sql 建表
- **data/** — raw (原始文件), processed (切塊 JSON), evalset (QA pairs)

資料流：使用者問題 → Voyage AI embedding → pgvector 向量搜尋 → Claude 生成回答

## Conventions

- TypeScript strict mode, ESM only (type: "module")
- 檔案命名 kebab-case
- 註解用繁體中文
- Commit message 用 conventional commits
- Embedding 維度 1024 (Voyage AI voyage-3)
- Vector 距離用 cosine (pgvector HNSW with vector_cosine_ops)
