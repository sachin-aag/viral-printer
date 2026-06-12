import { NextRequest, NextResponse } from "next/server";
import { getWorkflowsClient } from "@/lib/renderClient";
import type { GenerateRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateRequest;

  if (!body.prompt || !body.hookStyle || !body.videoMode || !body.profile) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const runId = crypto.randomUUID();
  const client = getWorkflowsClient();

  const serviceSlug = process.env.RENDER_WORKFLOWS_SERVICE_SLUG ?? "viralprinter-workflows";
  const taskSlug = `${serviceSlug}/tiktokPipeline`;

  const run = await client.startTask(taskSlug, [body, runId]);

  return NextResponse.json({ runId, taskRunId: run.taskRunId });
}
