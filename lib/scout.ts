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

const cache = new Map<string, { result: ScoutResult; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

type Section = "currentAffairs" | "thoughtPieces" | "tiktokTrends";

const SECTION_PROMPTS: Record<Section, string> = {
  currentAffairs:
    "Pick 3 breaking news / current affairs stories that would make great TikTok content. Focus on things people are talking about RIGHT NOW.",
  thoughtPieces:
    "Pick 3 deeper or contrarian angles — 'did you know' facts, hot takes, or underappreciated stories that make people think.",
  tiktokTrends:
    "Pick 3 trend-jacking opportunities — cultural moments, meme formats, or viral hooks that a creator could ride right now.",
};

export async function scoutWithSources(niche: string): Promise<ScoutResult> {
  const cached = cache.get(niche);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  const feeds = await fetchAllSources();
  const digest = buildDigest(feeds);

  const [currentAffairs, thoughtPieces, tiktokTrends] = await Promise.all([
    scoutSection("currentAffairs", niche, digest),
    scoutSection("thoughtPieces", niche, digest),
    scoutSection("tiktokTrends", niche, digest),
  ]);

  const result: ScoutResult = {
    currentAffairs,
    thoughtPieces,
    tiktokTrends,
    fetchedAt: new Date().toISOString(),
  };

  cache.set(niche, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

async function scoutSection(section: Section, niche: string, digest: string): Promise<ScoutIdea[]> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a TikTok content strategist for a "${niche}" account. Return ONLY a JSON array of exactly 3 objects. Each object: {"title":"<10 words","angle":"<80 chars","sourceUrl":"...","sourceName":"...","viralScore":1-10}. No markdown fences.`,
      messages: [
        {
          role: "user",
          content: `Headlines:\n${digest}\n\n${SECTION_PROMPTS[section]}`,
        },
      ],
    });

    const text = (msg.content[0] as { text: string }).text.trim();
    const json = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(json) as ScoutIdea[];
  } catch (err) {
    console.warn(`[scout] ${section} failed:`, err);
    return [];
  }
}

function buildDigest(feeds: SourceFeed[]): string {
  return feeds
    .map((feed) => {
      const items = feed.items
        .slice(0, 7)
        .map((item) => `• ${item.title} ${item.link}`)
        .join("\n");
      return `[${feed.source}]\n${items}`;
    })
    .join("\n\n");
}
