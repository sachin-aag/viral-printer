import { NextResponse } from "next/server";
import { ensureSchema, getPosts } from "@/lib/clickhouse";

export async function GET() {
  try {
    await ensureSchema();
    const posts = await getPosts(20);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[history] ClickHouse query failed:", err);
    return NextResponse.json({ posts: [] });
  }
}
