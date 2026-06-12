import { NextRequest, NextResponse } from "next/server";
import { PIPELINE_STEPS, type StepStatus } from "@/lib/types";

const IS_LOCAL = !process.env.RENDER_SDK_SOCKET_PATH;

function normalizeRunStatus(status: string) {
  return status === "completed" ? "succeeded" : status;
}

function createPendingSteps(): StepStatus[] {
  return PIPELINE_STEPS.map((step) => ({ ...step, status: "pending" }));
}

function normalizeStepStatus(status: string): StepStatus["status"] {
  if (status === "completed" || status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "running") return "running";
  return "pending";
}

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
      currentStep: job.currentStep ?? null,
      steps: job.steps,
      result: job.result ?? null,
      error: job.error ?? null,
    });
  }

  try {
    const { getWorkflowsClient } = await import("@/lib/renderClient");
    const client = getWorkflowsClient();
    const run = await client.getTaskRun(runId);
    const steps = createPendingSteps();

    try {
      const childRuns = await client.listTaskRuns({ rootTaskRunId: [runId] });
      for (const { taskRun } of childRuns) {
        const step = steps.find(
          ({ name }) => taskRun.taskId === name || taskRun.taskId.endsWith(`/${name}`)
        );
        if (step) step.status = normalizeStepStatus(taskRun.status);
      }
    } catch {
      // Keep the top-level run status available even if child task listing is unavailable.
    }

    return NextResponse.json({
      runId,
      taskRunId: runId,
      status: normalizeRunStatus(run.status),
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      currentStep: steps.find((step) => step.status === "running")?.name ?? null,
      steps,
      result: run.results?.[0] ?? null,
      error: run.error ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
}
