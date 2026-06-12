import type { WordTimestamp } from "./types";

interface CaptionGroup {
  words: string;
  start: number;
  end: number;
}

// Group words into caption chunks of ~3 words each
export function buildCaptionGroups(wordTimestamps: WordTimestamp[], wordsPerChunk = 3): CaptionGroup[] {
  const groups: CaptionGroup[] = [];

  for (let i = 0; i < wordTimestamps.length; i += wordsPerChunk) {
    const chunk = wordTimestamps.slice(i, i + wordsPerChunk);
    groups.push({
      words: chunk.map((w) => w.word).join(" "),
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
    });
  }

  return groups;
}

// Convert to ASS (Advanced SubStation Alpha) format for styled TikTok-like captions
export function buildAssSubtitles(wordTimestamps: WordTimestamp[], videoWidth = 1080, videoHeight = 1920): string {
  const groups = buildCaptionGroups(wordTimestamps, 3);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,70,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,50,50,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const events = groups
    .map((group) => {
      const start = formatAssTime(group.start);
      const end = formatAssTime(group.end);
      const text = group.words.toUpperCase();
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join("\n");

  return `${header}\n${events}\n`;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
