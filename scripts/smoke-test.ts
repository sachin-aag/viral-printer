// Dynamic imports ensure env is loaded before modules initialize
async function run() {
  // tsx auto-injects .env.local — no manual dotenv call needed

  const { generateHook, generateScript } = await import("../lib/anthropic");
  const { generateAudio: pollyAudio } = await import("../lib/polly");
  const { listBrainrotClips } = await import("../lib/s3");
  const os = await import("os");
  const path = await import("path");
  const fs = await import("fs");

  const profile = {
    niche: "Tech & Dev",
    styleDescription: "Concise, punchy, developer-focused",
    voiceId: "Joanna",
    ttsProvider: "polly" as const,
  };

  const runId = "smoke-" + Date.now();
  const outputDir = path.join(os.tmpdir(), `vp-${runId}`);
  fs.mkdirSync(outputDir, { recursive: true });

  // Step 1: Hook
  console.log("[1] Generating hook...");
  const hook = await generateHook("VSCode shortcuts", "curiosity", profile);
  console.log("   Hook:", hook);

  // Step 2: Script
  console.log("[2] Generating script...");
  const script = await generateScript(hook, "VSCode shortcuts", profile);
  console.log("   Topic:", script.topic, "| Words:", script.fullText.split(" ").length);

  // Step 3: Audio (Polly)
  console.log("[3] Generating audio via Polly...");
  const audio = await pollyAudio(script.fullText, "Joanna", outputDir);
  console.log("   Duration:", audio.durationSeconds.toFixed(1), "s | Words:", audio.wordTimestamps.length);

  // Step 4: Check brainrot clips
  console.log("[4] Listing brainrot clips in S3...");
  const clips = await listBrainrotClips();
  console.log("   Clips:", clips.length, clips.length === 0 ? "(empty — b-roll fallback active)" : clips.slice(0, 2));

  console.log("\n✓ Core pipeline steps passed!");
  console.log("  Audio file:", audio.audioPath);
}

run().catch((err) => {
  console.error("\n✗ FAILED:", err.message ?? err);
  process.exit(1);
});
