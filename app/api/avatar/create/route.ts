import { NextRequest, NextResponse } from "next/server";
import { createInstantAvatar } from "@/lib/heygen";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("video");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing video file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = (file as File).name || "avatar.mp4";

  const avatarId = await createInstantAvatar(buffer, filename);
  return NextResponse.json({ avatarId });
}
