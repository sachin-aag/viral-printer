import { NextRequest, NextResponse } from "next/server";

const IS_LOCAL = !process.env.RENDER_SDK_SOCKET_PATH;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  if (IS_LOCAL) {
    const { getJob } = await import("@/lib/localRunner");
    const job = getJob(runId);
    if (!job) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    return NextResponse.json({
      runId,
      taskRunId: runId,
      status: job.status,
      startedAt: job.startedAt,
      completedAt: job.completedAt ?? null,
      result: job.result ?? null,
      error: job.error ?? null,
    });
  }

  try {
    const { getWorkflowsClient } = await import("@/lib/renderClient");
    const run = await getWorkflowsClient().getTaskRun(runId);
    return NextResponse.json({
      runId,
      taskRunId: runId,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
    });
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
}
