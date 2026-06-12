import { anthropic } from "./anthropic";
import { fetchAllSources, type SourceFeed } from "./sources";

export interface ScoutIdea {
  title: string;
  angle: string;
  sourceUrl?: string;
  sourceName?: string;
  viralScore: number; // 1-10
}

export interface ScoutResult {
  currentAffairs: ScoutIdea[];
  thoughtPieces: ScoutIdea[];
  tiktokTrends: ScoutIdea[];
  fetchedAt: string;
}

export async function scoutWithSources(niche: string): Promise<ScoutResult> {
  const feeds = await fetchAllSources();
  const digest = buildDigest(feeds);

  const systemPrompt = `You are a viral content strategist for TikTok. You receive a digest of today's trending stories from multiple sources. Your job is to find angles that would work as short-form video content for a "${niche}" account.

For each idea, provide:
- title: a punchy video title (< 10 words)
- angle: how to spin this for TikTok (the unique take / hook direction)
- sourceUrl: the original article URL if applicable
- sourceName: which source it came from
- viralScore: 1-10 rating on viral potential for TikTok

Return ONLY valid JSON matching:
{
  "currentAffairs": [...],   // breaking news, tech launches, world events (3-5 items)
  "thoughtPieces": [...],    // deeper takes, contrarian opinions, "did you know" angles (3-5 items)
  "tiktokTrends": [...]      // trend-jacking opportunities, meme formats, cultural moments (3-5 items)
}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here's today's content digest:\n\n${digest}\n\nFind the best viral TikTok angles for a "${niche}" account.`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text.trim();
  const json = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const parsed = JSON.parse(json);

  return {
    currentAffairs: parsed.currentAffairs ?? [],
    thoughtPieces: parsed.thoughtPieces ?? [],
    tiktokTrends: parsed.tiktokTrends ?? [],
    fetchedAt: new Date().toISOString(),
  };
}

function buildDigest(feeds: SourceFeed[]): string {
  return feeds
    .map((feed) => {
      const items = feed.items
        .slice(0, 10)
        .map((item) => {
          const desc = item.description ? ` — ${item.description.slice(0, 120)}` : "";
          return `  • ${item.title}${desc}\n    ${item.link}`;
        })
        .join("\n");
      return `## ${feed.source} (${feed.category})\n${items}`;
    })
    .join("\n\n");
}
