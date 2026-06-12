import { createWorkflowsClient } from "@renderinc/sdk/workflows";

export function getWorkflowsClient() {
  const useLocal = process.env.NODE_ENV === "development" && !process.env.RENDER_WORKFLOWS_SERVICE_SLUG;

  return createWorkflowsClient({
    token: process.env.RENDER_API_KEY,
    useLocalDev: useLocal,
    localDevUrl: process.env.RENDER_LOCAL_DEV_URL ?? "http://localhost:10000",
  });
}
