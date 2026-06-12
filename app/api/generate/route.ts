import { NextRequest, NextResponse } from "next/server";
import type { GenerateRequest } from "@/lib/types";

const IS_LOCAL = !process.env.RENDER_SDK_SOCKET_PATH;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateRequest;

  if (!body.prompt || !body.hookStyle || !body.videoMode || !body.profile) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const runId = crypto.randomUUID();

  if (IS_LOCAL) {
    const { startLocalRun } = await import("@/lib/localRunner");
    startLocalRun(runId, body); // intentionally not awaited
    return NextResponse.json({ runId, taskRunId: runId });
  }

  const { getWorkflowsClient } = await import("@/lib/renderClient");
  const client = getWorkflowsClient();
  const serviceSlug = process.env.RENDER_WORKFLOWS_SERVICE_SLUG ?? "viralprinter-workflows";
  const run = await client.startTask(`${serviceSlug}/tiktokPipeline`, [body, runId]);

  return NextResponse.json({ runId, taskRunId: run.taskRunId });
}
