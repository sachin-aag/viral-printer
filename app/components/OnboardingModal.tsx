"use client";

import { useState } from "react";
import { VOICES_BY_PROVIDER, DEFAULT_VOICE_BY_PROVIDER } from "@/lib/voices";
import type { Profile, TtsProvider } from "@/lib/types";

const NICHES = [
  "Tech & Dev", "Finance & Money", "Fitness & Health", "Productivity",
  "AI & Startups", "Lifestyle", "Education", "Comedy & Entertainment",
];

const TTS_PROVIDERS: { id: TtsProvider; label: string; badge: string; desc: string }[] = [
  {
    id: "polly",
    label: "AWS Polly",
    badge: "Free",
    desc: "Neural voices via AWS. Free tier included with your AWS account.",
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    badge: "Premium",
    desc: "Ultra-realistic voices. Requires ELEVENLABS_API_KEY with credits.",
  },
];

interface Props {
  onSave: (profile: Profile) => void;
}

export function OnboardingModal({ onSave }: Props) {
  const [niche, setNiche] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>("polly");
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_BY_PROVIDER.polly);

  const effectiveNiche = niche === "Custom" ? customNiche : niche;
  const canSave = effectiveNiche.trim() && voiceId;
  const voices = VOICES_BY_PROVIDER[ttsProvider];

  function handleProviderChange(provider: TtsProvider) {
    setTtsProvider(provider);
    setVoiceId(DEFAULT_VOICE_BY_PROVIDER[provider]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-lg my-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome to ViralPrinter</h1>
          <p className="text-gray-400 text-sm">Set up your TikTok account profile to get started.</p>
        </div>

        <div className="space-y-5">
          {/* Niche */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Niche</label>
            <div className="grid grid-cols-2 gap-2">
              {[...NICHES, "Custom"].map((n) => (
                <button
                  key={n}
                  onClick={() => setNiche(n)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    niche === n ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {niche === "Custom" && (
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Describe your niche..."
                className="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            )}
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Style <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              placeholder="e.g. concise listicle, fast-paced tips, storytelling..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* TTS Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Voice Engine</label>
            <div className="grid grid-cols-2 gap-3">
              {TTS_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    ttsProvider === p.id
                      ? "bg-pink-600/20 border-pink-500"
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">{p.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      p.id === "polly" ? "bg-green-900/60 text-green-400" : "bg-purple-900/60 text-purple-400"
                    }`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Voice <span className="text-gray-600 font-normal">({ttsProvider === "polly" ? "AWS Polly" : "ElevenLabs"})</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoiceId(v.id)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    voiceId === v.id ? "bg-pink-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs opacity-70">{v.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          disabled={!canSave}
          onClick={() => onSave({ niche: effectiveNiche, styleDescription, voiceId, ttsProvider })}
          className="mt-6 w-full py-3 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors"
        >
          Start Creating
        </button>
      </div>
    </div>
  );
}
