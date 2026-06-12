import { NextRequest, NextResponse } from "next/server";
import { getWorkflowsClient } from "@/lib/renderClient";
import { TaskRunStatus } from "@renderinc/sdk/workflows";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const client = getWorkflowsClient();

  try {
    const run = await client.getTaskRun(runId);
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
