async function run() {
  const os = await import("os");
  const path = await import("path");
  const fs = await import("fs");

  const runId = "test-visuals-" + Date.now();

  console.log("[test] GEMINI_API_KEY set:", !!process.env.GEMINI_API_KEY);
  console.log("[test] PEXELS_API_KEY set:", !!process.env.PEXELS_API_KEY);
  console.log("[test] Starting fetchVisuals topic='tech startup' transitionDuration=3\n");

  // Call the inner function directly, bypassing the Render SDK task() wrapper
  const { fetchVisualsTask } = await import("../workers/tasks/fetchVisuals");
  const paths = await (fetchVisualsTask as unknown as (...args: unknown[]) => Promise<string[]>)(
    "tech startup",
    "broll",
    30,
    runId,
    3
  );

  console.log("\n[test] Got", paths.length, "clips:");
  for (const p of paths) {
    const stat = fs.statSync(p);
    console.log(" -", path.basename(p), "(" + (stat.size / 1024).toFixed(0) + " KB)");
  }

  if (paths.length === 0) {
    console.error("[test] FAIL: no clips returned");
    process.exit(1);
  }
  console.log("\n✓ fetchVisuals passed");
}

run().catch((err) => {
  console.error("\n✗ FAILED:", err.message ?? err);
  console.error(err);
  process.exit(1);
});

export {};
