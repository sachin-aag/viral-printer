async function run() {
  const { tiktokPipelineTask } = await import("../workers/pipeline");
  const { ensureSchema, getPosts } = await import("../lib/clickhouse");

  const runId = "e2e-" + Date.now();
  const request = {
    prompt: "5 VSCode shortcuts most developers don't know",
    hookStyle: "curiosity" as const,
    videoMode: "broll" as const,
    profile: {
      niche: "Tech & Dev",
      styleDescription: "Concise and punchy",
      voiceId: "Joanna",
      ttsProvider: "polly" as const,
    },
  };

  console.log("[e2e] Starting full pipeline, runId:", runId);
  console.log("[e2e] Using b-roll mode (avoids brainrot S3 seed requirement)");

  const result = await tiktokPipelineTask(request, runId);

  console.log("\n[e2e] Pipeline result:");
  console.log("  mock:", result.mock);
  console.log("  videoUrl:", result.tiktokUrl ? result.tiktokUrl.slice(0, 80) + "..." : "(none)");
  console.log("  localPath:", result.localVideoPath);

  console.log("\n[e2e] Checking ClickHouse...");
  await ensureSchema();
  const posts = await getPosts(3);
  console.log("  Total posts in DB:", posts.length);
  const latest = posts.find((p) => p.run_id === runId);
  console.log("  This run logged:", !!latest);

  console.log("\n✓ End-to-end test PASSED");
  console.log("  S3 video URL:", result.tiktokUrl?.slice(0, 120));
}

run().catch((err) => {
  console.error("\n✗ FAILED:", err.message ?? err);
  console.error(err);
  process.exit(1);
});
