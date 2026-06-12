async function run() {
  const { ensureSchema, insertPost, getPosts } = await import("../lib/clickhouse");

  console.log("[1] Creating schema...");
  await ensureSchema();
  console.log("    Schema OK");

  console.log("[2] Inserting test post...");
  await insertPost({
    run_id: "test-" + Date.now(),
    prompt: "Test prompt",
    hook: "Test hook",
    hook_style: "curiosity",
    video_mode: "brainrot",
    niche: "Tech",
    tiktok_url: "https://s3.example.com/test.mp4",
    local_video_path: "",
    status: "completed",
    mock: 1,
  });
  console.log("    Insert OK");

  console.log("[3] Querying posts...");
  const posts = await getPosts(5);
  console.log("    Posts found:", posts.length);
  if (posts.length > 0) console.log("    Latest:", posts[0].hook.slice(0, 50));

  console.log("\n✓ ClickHouse working!");
}

run().catch((err) => {
  console.error("\n✗ FAILED:", err.message ?? err);
  process.exit(1);
});

export {};
