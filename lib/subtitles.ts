import type { WordTimestamp } from "./types";

// TikTok-style captions: 3-word groups, active word highlighted in yellow, centered
export function buildAssSubtitles(wordTimestamps: WordTimestamp[], videoWidth = 1080, videoHeight = 1920): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,88,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,2,0,1,5,0,5,50,50,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const CHUNK = 3;
  const events: string[] = [];

  for (let i = 0; i < wordTimestamps.length; i += CHUNK) {
    const chunk = wordTimestamps.slice(i, i + CHUNK);

    // Each word in the group: highlight the active word in yellow, rest in white
    chunk.forEach((activeWord, j) => {
      const start = formatAssTime(activeWord.start);
      const end = formatAssTime(activeWord.end);

      const line = chunk
        .map((w, k) => {
          const upper = w.word.toUpperCase();
          // Yellow for active word, white for others (ASS uses BGR hex)
          return k === j
            ? `{\\c&H00FFFF&}${upper}{\\c&HFFFFFF&}`
            : upper;
        })
        .join(" ");

      // {\an5} = alignment override: center-middle of screen
      events.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,{\\an5}${line}`);
    });
  }

  return `${header}\n${events.join("\n")}\n`;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
