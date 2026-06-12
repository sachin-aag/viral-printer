/**
 * Local dev job runner — used when RENDER_SDK_SOCKET_PATH is not set.
 * Executes the pipeline in-process and tracks status in a module-level Map.
 * In production on Render this file is never imported.
 */

import type { GenerateRequest, PostResult } from "./types";

type JobStatus = "running" | "succeeded" | "failed";

interface Job {
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  result?: PostResult;
  error?: string;
}

// Module-level store — persists across requests within the same Node.js process
const jobs = new Map<string, Job>();

export function getJob(runId: string): Job | undefined {
  return jobs.get(runId);
}

export async function startLocalRun(runId: string, request: GenerateRequest): Promise<void> {
  jobs.set(runId, { status: "running", startedAt: new Date().toISOString() });

  // Fire-and-forget — do not await here
  runPipeline(runId, request).catch((err: unknown) => {
    jobs.set(runId, {
      status: "failed",
      startedAt: jobs.get(runId)?.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: String(err),
    });
  });
}

async function runPipeline(runId: string, request: GenerateRequest): Promise<void> {
  // Lazy import so this module doesn't pull worker deps into the Next.js browser bundle
  const { tiktokPipelineTask } = await import("../workers/pipeline");
  const result = await tiktokPipelineTask(request, runId);
  jobs.set(runId, {
    status: "succeeded",
    startedAt: jobs.get(runId)?.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    result,
  });
}
