import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { videoUrl, script } = await req.json();

  if (!videoUrl) {
    return NextResponse.json({ error: "Missing videoUrl" }, { status: 400 });
  }

  const connectedAccountId =
    process.env.COMPOSIO_TIKTOK_CONNECTED_ACCOUNT_ID?.trim() ||
    process.env.COMPOSIO_TIKTOK_ENTITY_ID?.trim() ||
    undefined;

  if (!connectedAccountId) {
    return NextResponse.json({
      mock: true,
      message: "TikTok posting not configured (no COMPOSIO_TIKTOK_CONNECTED_ACCOUNT_ID set)",
    });
  }

  try {
    const os = await import("os");
    const { Composio } = await import("@composio/core");
    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY!,
      toolkitVersions: { tiktok: "00000000_00" },
      dangerouslyAllowAutoUploadDownloadFiles: true,
      fileUploadDirs: [os.tmpdir()],
    });

    const caption = script
      ? `${script.hook}\n\n${script.hashtags?.map((h: string) => `#${h}`).join(" ") ?? ""}`.slice(0, 150)
      : "";

    const result = await composio.tools.execute("TIKTOK_UPLOAD_VIDEO", {
      userId: "default",
      connectedAccountId,
      arguments: {
        file_to_upload: videoUrl,
        caption,
        publish: true,
      },
    });

    if (!result.successful) {
      return NextResponse.json(
        { error: `TikTok upload failed: ${result.error ?? "unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ mock: false, success: true, publishId: (result.data as any)?.publish_id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
