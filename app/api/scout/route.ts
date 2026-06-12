import { NextRequest, NextResponse } from "next/server";
import { scoutWithSources } from "@/lib/scout";

export async function GET(req: NextRequest) {
  const niche = req.nextUrl.searchParams.get("niche") ?? "general";

  try {
    const result = await scoutWithSources(niche);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[scout] failed:", err);
    return NextResponse.json({ error: "Failed to scout ideas" }, { status: 500 });
  }
}
