import { NextRequest, NextResponse } from "next/server";
import { scoutIdeas } from "@/lib/anthropic";

export async function GET(req: NextRequest) {
  const niche = req.nextUrl.searchParams.get("niche") ?? "general";

  try {
    const ideas = await scoutIdeas(niche, 5);
    return NextResponse.json({ ideas });
  } catch (err) {
    console.error("[scout] failed:", err);
    return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}
