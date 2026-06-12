/**
 * Local dev job runner — used when RENDER_SDK_SOCKET_PATH is not set.
 * Executes the pipeline in-process and tracks status in a module-level Map.
 * In production on Render this file is never imported.
 */

import { PIPELINE_STEPS, type GenerateRequest, type PostResult, type StepStatus } from "./types";

type JobStatus = "running" | "succeeded" | "failed";

interface Job {
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  steps: StepStatus[];
  currentStep?: string;
  result?: PostResult;
  error?: string;
}

// Module-level store — persists across requests within the same Node.js process
const jobs = new Map<string, Job>();

export function getJob(runId: string): Job | undefined {
  return jobs.get(runId);
}

function createPendingSteps(): StepStatus[] {
  return PIPELINE_STEPS.map((step) => ({ ...step, status: "pending" }));
}

function updateStep(runId: string, stepName: string, status: StepStatus["status"]) {
  const job = jobs.get(runId);
  if (!job) return;

  jobs.set(runId, {
    ...job,
    currentStep: status === "running" ? stepName : job.currentStep,
    steps: job.steps.map((step) => (step.name === stepName ? { ...step, status } : step)),
  });
}

export async function startLocalRun(runId: string, request: GenerateRequest): Promise<void> {
  jobs.set(runId, {
    status: "running",
    startedAt: new Date().toISOString(),
    steps: createPendingSteps(),
  });

  // Fire-and-forget — do not await here
  runPipeline(runId, request).catch((err: unknown) => {
    console.error("[localRunner] Pipeline FAILED:", err);
    jobs.set(runId, {
      status: "failed",
      startedAt: jobs.get(runId)?.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      steps: jobs.get(runId)?.steps ?? createPendingSteps(),
      currentStep: jobs.get(runId)?.currentStep,
      error: String(err),
    });
  });
}

async function runPipeline(runId: string, request: GenerateRequest): Promise<void> {
  // Lazy import so this module doesn't pull worker deps into the Next.js browser bundle
  const { runTikTokPipeline } = await import("../workers/pipeline");
  const result = await runTikTokPipeline(request, runId, (stepName, status) =>
    updateStep(runId, stepName, status)
  );
  jobs.set(runId, {
    status: "succeeded",
    startedAt: jobs.get(runId)?.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    steps: jobs.get(runId)?.steps ?? createPendingSteps(),
    currentStep: undefined,
    result,
  });
}
