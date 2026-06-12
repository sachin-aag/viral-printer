import { fetchRSS, type RSSItem } from "./rss";

export interface SourceFeed {
  source: string;
  category: "news" | "tech" | "culture" | "trends";
  items: RSSItem[];
}

const FEEDS: { url: string; source: string; category: SourceFeed["category"] }[] = [
  {
    url: "https://hnrss.org/frontpage?count=10",
    source: "Hacker News",
    category: "tech",
  },
  {
    url: "https://www.theverge.com/rss/index.xml",
    source: "The Verge",
    category: "news",
  },
  {
    url: "https://techcrunch.com/feed/",
    source: "TechCrunch",
    category: "tech",
  },
  {
    url: "https://trends.google.com/trending/rss?geo=US",
    source: "Google Trends",
    category: "trends",
  },
  {
    url: "https://feeds.arstechnica.com/arstechnica/features",
    source: "Ars Technica",
    category: "culture",
  },
];

export async function fetchAllSources(): Promise<SourceFeed[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const items = await fetchRSS(feed.url, 15);
      return { source: feed.source, category: feed.category, items } satisfies SourceFeed;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<SourceFeed> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((f) => f.items.length > 0);
}
