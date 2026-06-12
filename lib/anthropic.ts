import Anthropic from "@anthropic-ai/sdk";
import type { HookStyle, Profile, ScriptResult } from "./types";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const HOOK_PROMPTS: Record<HookStyle, (prompt: string, profile: Profile) => string> = {
  curiosity: (prompt, profile) =>
    `Write a single TikTok hook sentence for "${prompt}" in the ${profile.niche} niche. Style: curiosity. Formula: "You won't believe what [X] actually [does/means/is]..." Keep it under 15 words. Return ONLY the hook sentence, nothing else.`,
  ragebait: (prompt, profile) =>
    `Write a single TikTok hook sentence for "${prompt}" in the ${profile.niche} niche. Style: rage bait. Formula: "Everyone is doing [X] WRONG and it's [consequence]..." Keep it under 15 words. Return ONLY the hook sentence, nothing else.`,
  controversy: (prompt, profile) =>
    `Write a single TikTok hook sentence for "${prompt}" in the ${profile.niche} niche. Style: controversy. Formula: "Unpopular opinion: [X] is actually [Y]" Keep it under 15 words. Return ONLY the hook sentence, nothing else.`,
  stats: (prompt, profile) =>
    `Write a single TikTok hook sentence for "${prompt}" in the ${profile.niche} niche. Style: stats/data. Formula: "[N]% of people don't know [X]" Keep it under 15 words. Return ONLY the hook sentence, nothing else.`,
  question: (prompt, profile) =>
    `Write a single TikTok hook sentence for "${prompt}" in the ${profile.niche} niche. Style: question. Formula: "What if [X] could [Y]?" Keep it under 15 words. Return ONLY the hook sentence, nothing else.`,
  storytelling: (prompt, profile) =>
    `Write a single TikTok hook sentence for "${prompt}" in the ${profile.niche} niche. Style: storytelling. Formula: "I was [doing X] when I discovered [Y]..." Keep it under 15 words. Return ONLY the hook sentence, nothing else.`,
};

export async function generateHook(prompt: string, hookStyle: HookStyle, profile: Profile): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 100,
    messages: [{ role: "user", content: HOOK_PROMPTS[hookStyle](prompt, profile) }],
  });
  return (msg.content[0] as { text: string }).text.trim();
}

export async function generateScript(hook: string, prompt: string, profile: Profile): Promise<ScriptResult> {
  const systemPrompt = `You are a TikTok script writer specializing in ${profile.niche} content. ${profile.styleDescription}
Write scripts that are:
- 45-60 seconds when spoken aloud (roughly 120-150 words)
- Natural, conversational, no filler words
- Start with the hook, then deliver value quickly
- End with a clear CTA

Return ONLY valid JSON matching this schema:
{
  "hook": "the opening hook sentence",
  "fullText": "the complete script as one string to be read aloud",
  "segments": ["sentence 1", "sentence 2", "..."],
  "topic": "2-3 word topic for visual search",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Hook: "${hook}"\nTopic: "${prompt}"\nWrite the full TikTok script now.`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text.trim();
  const json = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(json) as ScriptResult;
}

export async function scoutIdeas(niche: string, count = 5): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Generate ${count} trending TikTok video topic ideas for a ${niche} account. These should be specific, timely, and have high viral potential right now. Return ONLY a JSON array of strings, e.g. ["idea 1", "idea 2", ...]`,
      },
    ],
  });
  const text = (msg.content[0] as { text: string }).text.trim();
  const json = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(json) as string[];
}
