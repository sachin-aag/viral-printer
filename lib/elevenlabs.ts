import fs from "fs";
import path from "path";
import type { AudioResult, WordTimestamp } from "./types";

const BASE_URL = "https://api.elevenlabs.io/v1";

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsTimestampResponse {
  audio_base64: string;
  alignment: ElevenLabsAlignment;
}

export async function generateAudio(text: string, voiceId: string, outputDir: string): Promise<AudioResult> {
  const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}/with-timestamps`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as ElevenLabsTimestampResponse;
  const audioBuffer = Buffer.from(data.audio_base64, "base64");
  const audioPath = path.join(outputDir, "voiceover.mp3");
  fs.writeFileSync(audioPath, audioBuffer);

  const wordTimestamps = extractWordTimestamps(data.alignment);
  const durationSeconds = data.alignment.character_end_times_seconds.at(-1) ?? 0;

  return { audioPath, wordTimestamps, durationSeconds };
}

function extractWordTimestamps(alignment: ElevenLabsAlignment): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  let currentWord = "";
  let wordStart = 0;

  for (let i = 0; i < alignment.characters.length; i++) {
    const char = alignment.characters[i];
    const startTime = alignment.character_start_times_seconds[i];
    const endTime = alignment.character_end_times_seconds[i];

    if (char === " " || i === alignment.characters.length - 1) {
      if (char !== " ") currentWord += char;
      if (currentWord.trim()) {
        words.push({ word: currentWord.trim(), start: wordStart, end: endTime });
      }
      currentWord = "";
    } else {
      if (!currentWord) wordStart = startTime;
      currentWord += char;
    }
  }

  return words;
}
