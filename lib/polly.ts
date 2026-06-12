import {
  PollyClient,
  SynthesizeSpeechCommand,
  SpeechMarkType,
  Engine,
  LanguageCode,
  OutputFormat,
  TextType,
  VoiceId,
} from "@aws-sdk/client-polly";
import fs from "fs";
import path from "path";
import type { AudioResult, WordTimestamp } from "./types";

function makePollyClient() {
  return new PollyClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export const DEFAULT_VOICE_ID = "Joanna";

export const VOICES = [
  { id: "Joanna", name: "Joanna", description: "US English, neural female" },
  { id: "Matthew", name: "Matthew", description: "US English, neural male" },
  { id: "Salli", name: "Salli", description: "US English, female" },
  { id: "Joey", name: "Joey", description: "US English, male" },
  { id: "Kendra", name: "Kendra", description: "US English, female" },
  { id: "Kevin", name: "Kevin", description: "US English, young male" },
  { id: "Ruth", name: "Ruth", description: "US English, neural female" },
  { id: "Stephen", name: "Stephen", description: "US English, neural male" },
];

interface PollyWordMark {
  time: number;   // ms from start
  type: string;
  start: number;
  end: number;
  value: string;
}

export async function generateAudio(text: string, voiceId: string, outputDir: string): Promise<AudioResult> {
  const polly = makePollyClient();
  const audioPath = path.join(outputDir, "voiceover.mp3");
  const engine: Engine = ["Joanna", "Matthew", "Ruth", "Stephen", "Kevin"].includes(voiceId)
    ? Engine.NEURAL
    : Engine.STANDARD;

  // 1. Synthesize audio
  const audioCmd = new SynthesizeSpeechCommand({
    Text: text,
    VoiceId: voiceId as VoiceId,
    Engine: engine,
    OutputFormat: OutputFormat.MP3,
    TextType: TextType.TEXT,
    LanguageCode: LanguageCode.en_US,
  });
  const audioRes = await polly.send(audioCmd);
  const audioStream = audioRes.AudioStream;
  if (!audioStream) throw new Error("Polly returned no audio stream");

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  fs.writeFileSync(audioPath, Buffer.concat(chunks));

  // 2. Get word-level speech marks (separate call — Polly requirement)
  const marksCmd = new SynthesizeSpeechCommand({
    Text: text,
    VoiceId: voiceId as VoiceId,
    Engine: engine,
    OutputFormat: OutputFormat.JSON,
    SpeechMarkTypes: [SpeechMarkType.WORD],
    TextType: TextType.TEXT,
    LanguageCode: LanguageCode.en_US,
  });
  const marksRes = await polly.send(marksCmd);
  const marksStream = marksRes.AudioStream;
  if (!marksStream) throw new Error("Polly returned no speech marks stream");

  const markChunks: Uint8Array[] = [];
  for await (const chunk of marksStream as AsyncIterable<Uint8Array>) {
    markChunks.push(chunk);
  }
  const marksText = Buffer.concat(markChunks).toString("utf-8");

  // Speech marks are newline-delimited JSON objects
  const wordMarks: PollyWordMark[] = marksText
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PollyWordMark)
    .filter((m) => m.type === "word");

  const wordTimestamps = buildWordTimestamps(wordMarks);
  const durationSeconds = wordTimestamps.at(-1)?.end ?? 0;

  return { audioPath, wordTimestamps, durationSeconds };
}

function buildWordTimestamps(marks: PollyWordMark[]): WordTimestamp[] {
  return marks.map((mark, i) => ({
    word: mark.value,
    start: mark.time / 1000,
    // end = start of next word, or start + 0.4s for the last word
    end: marks[i + 1] ? marks[i + 1].time / 1000 : mark.time / 1000 + 0.4,
  }));
}
