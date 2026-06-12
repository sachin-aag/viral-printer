import { NextResponse } from "next/server";
import { getPosts } from "@/lib/clickhouse";

export async function GET() {
  try {
    const posts = await getPosts(20);
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[history] ClickHouse query failed:", err);
    // Return empty list rather than 500 if ClickHouse is not configured
    return NextResponse.json({ posts: [] });
  }
}
