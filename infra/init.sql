-- 啟用 pgvector 擴充
CREATE EXTENSION IF NOT EXISTS vector;

-- 文件 chunk 表
CREATE TABLE IF NOT EXISTS documents (
    id            BIGSERIAL PRIMARY KEY,
    source        TEXT        NOT NULL,
    chunk_index   INTEGER     NOT NULL,
    content       TEXT        NOT NULL,
    embedding     vector(1024),
    metadata      JSONB       DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- 為來源 + chunk 索引建立唯一約束，避免重複匯入
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_source_chunk
    ON documents (source, chunk_index);

-- 為向量搜尋建立 HNSW 索引（cosine 距離）
CREATE INDEX IF NOT EXISTS idx_documents_embedding
    ON documents USING hnsw (embedding vector_cosine_ops);
