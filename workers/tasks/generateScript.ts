import { task } from "@renderinc/sdk/workflows";
import { generateScript as claudeGenerateScript } from "@/lib/anthropic";
import type { Profile, ScriptResult } from "@/lib/types";

export const generateScriptTask = task(
  { name: "generateScript", timeoutSeconds: 45 },
  async function generateScript(hook: string, prompt: string, profile: Profile): Promise<ScriptResult> {
    console.log(`[generateScript] hook="${hook.slice(0, 50)}..."`);
    return claudeGenerateScript(hook, prompt, profile);
  }
);
