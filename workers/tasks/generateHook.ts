import { task } from "@renderinc/sdk/workflows";
import { generateHook as claudeGenerateHook } from "@/lib/anthropic";
import type { HookStyle, Profile } from "@/lib/types";

export const generateHookTask = task(
  { name: "generateHook", timeoutSeconds: 30 },
  async function generateHook(prompt: string, hookStyle: HookStyle, profile: Profile): Promise<string> {
    console.log(`[generateHook] prompt="${prompt}" style=${hookStyle}`);
    return claudeGenerateHook(prompt, hookStyle, profile);
  }
);
