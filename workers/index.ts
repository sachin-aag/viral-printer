import { startTaskServer } from "@renderinc/sdk/workflows";

// Import all tasks to register them
import "./tasks/generateHook";
import "./tasks/generateScript";
import "./tasks/generateAudio";
import "./tasks/fetchVisuals";
import "./tasks/assembleVideo";
import "./tasks/uploadToS3";
import "./tasks/postToTikTok";
import "./tasks/logAnalytics";
import "./pipeline";

if (process.env.RENDER_SDK_SOCKET_PATH) {
  console.log("[ViralPrinter] Starting Render Workflows task server...");
  startTaskServer().catch((err: unknown) => {
    console.error("[ViralPrinter] Task server failed:", err);
    process.exit(1);
  });
} else {
  console.log("[ViralPrinter] RENDER_SDK_SOCKET_PATH not set — tasks run in-process via localRunner.");
}
