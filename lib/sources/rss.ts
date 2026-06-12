export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
}

export async function fetchRSS(url: string, limit = 20): Promise<RSSItem[]> {
  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(5000),
    headers: { "User-Agent": "ViralPrinter/1.0 (RSS Reader)" },
  };

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    console.warn(`[rss] failed to fetch ${url}: ${res.status}`);
    return [];
  }

  const xml = await res.text();
  const items: RSSItem[] = [];

  // Lightweight XML parsing — no dependency needed for RSS
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");

    if (title) {
      items.push({ title, link: link || "", description, pubDate });
    }
  }

  // Also handle Atom <entry> format
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null && items.length < limit) {
      const block = match[1];
      const title = extractTag(block, "title");
      const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] || extractTag(block, "link");
      const description = extractTag(block, "summary") || extractTag(block, "content");
      const pubDate = extractTag(block, "published") || extractTag(block, "updated");

      if (title) {
        items.push({ title, link: link || "", description, pubDate });
      }
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | undefined {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"));
  if (cdataMatch) return cdataMatch[1].trim();

  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].replace(/<[^>]+>/g, "").trim() : undefined;
}
