import { createClient } from "@clickhouse/client";

export const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL ?? "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER ?? "default",
  password: process.env.CLICKHOUSE_PASSWORD ?? "",
  database: "viralprinter",
});

// Schema client has no database set so CREATE DATABASE doesn't self-reference
const schemaClient = createClient({
  url: process.env.CLICKHOUSE_URL ?? "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER ?? "default",
  password: process.env.CLICKHOUSE_PASSWORD ?? "",
});

export async function ensureSchema(): Promise<void> {
  await schemaClient.command({
    query: `CREATE DATABASE IF NOT EXISTS viralprinter`,
  });

  await clickhouse.command({
    query: `
      CREATE TABLE IF NOT EXISTS viralprinter.posts (
        id UUID DEFAULT generateUUIDv4(),
        run_id String,
        prompt String,
        hook String,
        hook_style String,
        video_mode String,
        niche String,
        tiktok_url String DEFAULT '',
        local_video_path String DEFAULT '',
        status String,
        mock UInt8 DEFAULT 1,
        created_at DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY created_at
    `,
  });
}

export interface PostRecord {
  run_id: string;
  prompt: string;
  hook: string;
  hook_style: string;
  video_mode: string;
  niche: string;
  tiktok_url?: string;
  local_video_path?: string;
  status: string;
  mock: number;
}

export async function insertPost(record: PostRecord): Promise<void> {
  await clickhouse.insert({
    table: "viralprinter.posts",
    values: [record],
    format: "JSONEachRow",
  });
}

export async function getPosts(limit = 20): Promise<PostRecord[]> {
  const result = await clickhouse.query({
    query: `SELECT * FROM viralprinter.posts ORDER BY created_at DESC LIMIT {limit:UInt32}`,
    query_params: { limit },
    format: "JSONEachRow",
  });
  const rows = await result.json<PostRecord[]>();
  return rows.flat();
}
