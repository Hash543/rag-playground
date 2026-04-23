import pg from 'pg'
import { config } from '../config.js'

/**
 * 共用 Postgres connection pool。
 * ingest 腳本、retrieval、chat 端點都從這裡拿 client。
 */
export const pool = new pg.Pool({ connectionString: config.databaseUrl })
