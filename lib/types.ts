export type HookStyle = "curiosity" | "ragebait" | "controversy" | "stats" | "question" | "storytelling";

export type VideoMode = "brainrot" | "broll" | "speaker";

export type TtsProvider = "polly" | "elevenlabs";

export interface Profile {
  niche: string;
  styleDescription: string;
  voiceId: string;
  ttsProvider: TtsProvider;
  avatarId?: string;
}

export interface ScriptResult {
  hook: string;
  fullText: string;
  segments: string[];
  topic: string;
  hashtags: string[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface AudioResult {
  audioPath: string;
  wordTimestamps: WordTimestamp[];
  durationSeconds: number;
}

export interface GenerateRequest {
  prompt: string;
  hookStyle: HookStyle;
  videoMode: VideoMode;
  transitionDuration?: number;
  profile: Profile;
  skipPost?: boolean;
}

export interface PostResult {
  mock: boolean;
  tiktokUrl?: string;
  localVideoPath?: string;
  publishId?: string;
}

export interface RunStatus {
  runId: string;
  status: "pending" | "running" | "succeeded" | "failed" | "canceled";
  currentStep?: string;
  steps: StepStatus[];
  result?: PostResult;
  error?: string;
}

export interface StepStatus {
  name: string;
  label: string;
  status: "pending" | "running" | "succeeded" | "failed";
}

export const PIPELINE_STEPS = [
  { name: "generateHook", label: "Generating hook" },
  { name: "generateScript", label: "Writing script" },
  { name: "generateAudio", label: "Creating voiceover" },
  { name: "fetchVisuals", label: "Sourcing visuals" },
  { name: "assembleVideo", label: "Assembling video" },
  { name: "uploadToS3", label: "Uploading media" },
  { name: "postToTikTok", label: "Posting to TikTok" },
  { name: "logAnalytics", label: "Saving analytics" },
] as const;
