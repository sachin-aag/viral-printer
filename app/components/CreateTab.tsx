"use client";

import { useState } from "react";
import type { HookStyle, VideoMode, Profile, GenerateRequest } from "@/lib/types";

const HOOK_STYLES: { id: HookStyle; label: string; emoji: string; desc: string }[] = [
  { id: "curiosity", label: "Curiosity", emoji: "🤔", desc: "You won't believe..." },
  { id: "ragebait", label: "Rage Bait", emoji: "😤", desc: "Everyone's doing this WRONG..." },
  { id: "controversy", label: "Controversy", emoji: "🔥", desc: "Unpopular opinion..." },
  { id: "stats", label: "Stats", emoji: "📊", desc: "X% of people don't know..." },
  { id: "question", label: "Question", emoji: "❓", desc: "What if you could..." },
  { id: "storytelling", label: "Story", emoji: "📖", desc: "I was doing X when..." },
];

interface GenerateState {
  status: "idle" | "generating" | "done" | "error";
  taskRunId?: string;
  error?: string;
  pollInterval?: ReturnType<typeof setInterval>;
}

interface Props {
  profile: Profile;
  initialPrompt?: string;
  onGenerated: () => void;
}

export function CreateTab({ profile, initialPrompt = "", onGenerated }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [hookStyle, setHookStyle] = useState<HookStyle>("curiosity");
  const [videoMode, setVideoMode] = useState<VideoMode>("brainrot");
  const [state, setState] = useState<GenerateState>({ status: "idle" });
  const [steps, setSteps] = useState<Record<string, "pending" | "running" | "done">>({});

  async function handleGenerate() {
    if (!prompt.trim() || state.status === "generating") return;
    setState({ status: "generating" });

    const body: GenerateRequest = { prompt, hookStyle, videoMode, profile };
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");

      setState({ status: "generating", taskRunId: data.taskRunId });
      pollStatus(data.taskRunId);
    } catch (err) {
      setState({ status: "error", error: String(err) });
    }
  }

  function pollStatus(taskRunId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${taskRunId}`);
        const data = await res.json();
        if (data.status === "succeeded") {
          clearInterval(interval);
          setState((s) => ({ ...s, status: "done" }));
          onGenerated();
        } else if (data.status === "failed" || data.status === "canceled") {
          clearInterval(interval);
          setState((s) => ({ ...s, status: "error", error: data.error ?? "Pipeline failed." }));
        }
      } catch {
        // ignore transient poll failures
      }
    }, 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Create TikTok</h2>
        <p className="text-sm text-gray-400">One prompt → hook → script → video → posted</p>
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">What's today's video about?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`e.g. "5 VSCode shortcuts most devs don't know"`}
          rows={3}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pink-500 resize-none"
        />
      </div>

      {/* Hook style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Hook Style</label>
        <div className="grid grid-cols-3 gap-2">
          {HOOK_STYLES.map((h) => (
            <button
              key={h.id}
              onClick={() => setHookStyle(h.id)}
              className={`p-3 rounded-xl text-left transition-colors border ${
                hookStyle === h.id
                  ? "bg-pink-600/20 border-pink-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <div className="text-lg mb-1">{h.emoji}</div>
              <div className="text-xs font-semibold">{h.label}</div>
              <div className="text-xs opacity-60 mt-0.5 truncate">{h.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Video mode */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Video Style</label>
        <div className="grid grid-cols-2 gap-3">
          {(["brainrot", "broll"] as VideoMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setVideoMode(mode)}
              className={`p-4 rounded-xl border text-left transition-colors ${
                videoMode === mode
                  ? "bg-pink-600/20 border-pink-500"
                  : "bg-gray-900 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="text-xl mb-1">{mode === "brainrot" ? "🎮" : "🎬"}</div>
              <div className="text-sm font-semibold text-white">
                {mode === "brainrot" ? "Brainrot" : "B-Roll"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {mode === "brainrot"
                  ? "Hypnotic satisfying background"
                  : "Topic-matched stock footage"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || state.status === "generating"}
        className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-pink-900/30"
      >
        {state.status === "generating" ? (
          <span className="flex items-center justify-center gap-3">
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating your TikTok...
          </span>
        ) : (
          "Generate & Post 🚀"
        )}
      </button>

      {state.status === "generating" && state.taskRunId && (
        <PipelineProgress taskRunId={state.taskRunId} />
      )}

      {state.status === "done" && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm text-center">
          ✓ Video generated! Check History tab for the result.
        </div>
      )}

      {state.status === "error" && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm text-center">
          {state.error}
        </div>
      )}
    </div>
  );
}

function PipelineProgress({ taskRunId }: { taskRunId: string }) {
  const STEPS = [
    "Generating hook",
    "Writing script",
    "Creating voiceover",
    "Sourcing visuals",
    "Assembling video",
    "Uploading media",
    "Posting to TikTok",
    "Saving analytics",
  ];

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <p className="text-xs text-gray-500 mb-3 font-mono">run: {taskRunId.slice(0, 16)}...</p>
      <div className="space-y-2">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-700 shrink-0" />
            <span className="text-xs text-gray-500">{step}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-3">Pipeline running on Render Workflows...</p>
    </div>
  );
}
