// Browser-safe voice constants for both TTS providers
import type { TtsProvider } from "./types";

export const POLLY_VOICES = [
  { id: "Joanna", name: "Joanna", description: "US female, neural" },
  { id: "Matthew", name: "Matthew", description: "US male, neural" },
  { id: "Ruth", name: "Ruth", description: "US female, neural" },
  { id: "Stephen", name: "Stephen", description: "US male, neural" },
  { id: "Salli", name: "Salli", description: "US female" },
  { id: "Joey", name: "Joey", description: "US male" },
  { id: "Kendra", name: "Kendra", description: "US female" },
  { id: "Kevin", name: "Kevin", description: "US young male" },
];

export const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Calm, professional" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", description: "Strong, confident" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft, warm" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Well-rounded male" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", description: "Emotional, young" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Deep, male" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", description: "Crisp, older male" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Deep, narrative" },
];

export const VOICES_BY_PROVIDER: Record<TtsProvider, typeof POLLY_VOICES> = {
  polly: POLLY_VOICES,
  elevenlabs: ELEVENLABS_VOICES,
};

export const DEFAULT_VOICE_BY_PROVIDER: Record<TtsProvider, string> = {
  polly: "Joanna",
  elevenlabs: "21m00Tcm4TlvDq8ikWAM",
};

// Legacy single-export used by polly.ts / elevenlabs.ts server imports
export const DEFAULT_VOICE_ID = "Joanna";
export const VOICES = POLLY_VOICES;
