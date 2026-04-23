# RAG Playground

RAG (Retrieval-Augmented Generation) 練習專案。
第一版 MVP：**Diablo 2 Resurrected 攻略助理**。

## 技術棧

| 層級 | 技術 |
|------|------|
| Backend | Node.js 20 + TypeScript + Fastify |
| LLM | Anthropic Claude (@anthropic-ai/sdk) |
| Embedding | Voyage AI (voyage-3, 1024 維) |
| Vector DB | PostgreSQL 16 + pgvector |
| Frontend | Vue 3 + Vite + TypeScript + Pinia |
| 部署 | Docker Compose |
| 套件管理 | pnpm workspaces |

## 快速啟動

### 前置需求

- Node.js >= 20
- pnpm (`npm install -g pnpm`)
- Docker & Docker Compose

### 步驟

```bash
# 1. 安裝依賴
pnpm install

# 2. 複製環境變數
cp .env.example .env
# 編輯 .env 填入 API keys

# 3. 啟動 PostgreSQL (pgvector)
docker compose -f infra/docker-compose.yml up -d

# 4. 啟動開發伺服器（前後端同時）
pnpm dev

# 或分別啟動
pnpm dev:api   # http://localhost:4100
pnpm dev:web   # http://localhost:4300
```

### 驗證

- API 健康檢查：`curl http://localhost:4100/health`
- 前端：瀏覽器開啟 `http://localhost:4300`

## 專案結構

```
rag-playground/
├── apps/
│   ├── api/           # Fastify 後端
│   └── web/           # Vue 3 前端
├── packages/
│   └── shared/        # 共用型別
├── data/
│   ├── raw/           # 原始文件 (PDF/MD)
│   ├── processed/     # 切塊後的 JSON
│   └── evalset/       # 評測用 QA pairs
├── infra/
│   ├── docker-compose.yml
│   └── init.sql       # pgvector 初始化
└── docs/
    └── ARCHITECTURE.md
```
