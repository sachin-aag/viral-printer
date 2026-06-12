"use client";

import { useState } from "react";
import {
  PIPELINE_STEPS,
  type GenerateRequest,
  type HookStyle,
  type Profile,
  type RunStatus,
  type StepStatus,
  type VideoMode,
} from "@/lib/types";

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
  runStatus?: RunStatus;
  videoUrl?: string;
  error?: string;
  pollInterval?: ReturnType<typeof setInterval>;
  postStatus?: "idle" | "posting" | "posted" | "error";
  postError?: string;
}

interface Props {
  profile: Profile;
  initialPrompt?: string;
  onGenerated: () => void;
}

const TRANSITION_DURATIONS = [2, 3, 5, 8] as const;

export function CreateTab({ profile, initialPrompt = "", onGenerated }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [hookStyle, setHookStyle] = useState<HookStyle>("curiosity");
  const [videoMode, setVideoMode] = useState<VideoMode>("brainrot");
  const [transitionDuration, setTransitionDuration] = useState(3);
  const [state, setState] = useState<GenerateState>({ status: "idle" });

  async function handleGenerate() {
    if (!prompt.trim() || state.status === "generating") return;
    setState({ status: "generating" });

    const body: GenerateRequest = {
      prompt,
      hookStyle,
      videoMode,
      ...(videoMode === "broll" && { transitionDuration }),
      profile,
      skipPost: true,
    };
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

  async function handlePost() {
    if (!state.videoUrl || state.postStatus === "posting") return;
    setState((s) => ({ ...s, postStatus: "posting", postError: undefined }));
    try {
      const res = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: state.videoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Post failed");
      if (data.mock) {
        setState((s) => ({ ...s, postStatus: "error", postError: "TikTok posting not configured on server" }));
      } else {
        setState((s) => ({ ...s, postStatus: "posted" }));
      }
    } catch (err) {
      setState((s) => ({ ...s, postStatus: "error", postError: String(err) }));
    }
  }

  function pollStatus(taskRunId: string) {
    let interval: ReturnType<typeof setInterval> | undefined;

    const refreshStatus = async () => {
      try {
        const res = await fetch(`/api/status/${taskRunId}`);
        const data = (await res.json()) as RunStatus;
        if (!res.ok) throw new Error(data.error ?? "Failed to load status.");

        setState((s) => ({ ...s, runStatus: data }));
        if (data.status === "succeeded") {
          if (interval) clearInterval(interval);
          const videoUrl = data.result?.tiktokUrl ?? undefined;
          setState((s) => ({ ...s, status: "done", videoUrl, postStatus: "idle" }));
          onGenerated();
        } else if (data.status === "failed" || data.status === "canceled") {
          if (interval) clearInterval(interval);
          setState((s) => ({ ...s, status: "error", error: data.error ?? "Pipeline failed." }));
        }
      } catch {
        // ignore transient poll failures
      }
    };

    void refreshStatus();
    interval = setInterval(refreshStatus, 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Create TikTok</h2>
        <p className="text-sm text-gray-400">One prompt → hook → script → video → ready to post</p>
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
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { mode: "brainrot", emoji: "🎮", label: "Brainrot", desc: "Hypnotic background" },
              { mode: "broll",    emoji: "🎬", label: "B-Roll",   desc: "Topic-matched footage" },
              { mode: "speaker",  emoji: "🎙️", label: "Speaker",  desc: profile.avatarId ? "Brainrot + your avatar" : "Set up avatar first" },
            ] as const
          ).map(({ mode, emoji, label, desc }) => {
            const disabled = mode === "speaker" && !profile.avatarId;
            return (
              <button
                key={mode}
                onClick={() => !disabled && setVideoMode(mode)}
                disabled={disabled}
                title={disabled ? "Upload an avatar in your profile to enable Speaker mode" : undefined}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  disabled
                    ? "bg-gray-900/40 border-gray-800/50 opacity-50 cursor-not-allowed"
                    : videoMode === mode
                    ? "bg-pink-600/20 border-pink-500"
                    : "bg-gray-900 border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="text-lg mb-1">{emoji}</div>
                <div className="text-xs font-semibold text-white">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scene duration — broll only */}
      {videoMode === "broll" && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Scene Duration
            <span className="ml-2 text-xs text-gray-500 font-normal">how long each clip plays</span>
          </label>
          <div className="flex gap-2">
            {TRANSITION_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setTransitionDuration(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  transitionDuration === d
                    ? "bg-pink-600/20 border-pink-500 text-white"
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || state.status === "generating"}
        className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-pink-900/30"
      >
        {state.status === "generating" ? (
          <span className="flex items-center justify-center gap-3">
            <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating your video...
          </span>
        ) : (
          "Generate Video 🎬"
        )}
      </button>

      {state.status === "generating" && state.taskRunId && (
        <PipelineProgress taskRunId={state.taskRunId} runStatus={state.runStatus} />
      )}

      {state.status === "done" && (
        <div className="p-4 bg-green-900/30 border border-green-700 rounded-xl space-y-3">
          <p className="text-green-400 text-sm text-center font-medium">✓ Video generated!</p>
          {state.videoUrl && (
            <div className="space-y-2">
              <video
                src={state.videoUrl}
                controls
                playsInline
                className="w-full rounded-lg max-h-96 bg-black"
              />
              <a
                href={state.videoUrl}
                download="viralprinter-video.mp4"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-pink-400 hover:text-pink-300 transition-colors"
              >
                Download MP4 ↓
              </a>
            </div>
          )}

          {/* Post to TikTok button */}
          <button
            onClick={handlePost}
            disabled={state.postStatus === "posting" || state.postStatus === "posted"}
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30"
          >
            {state.postStatus === "posting" ? (
              <span className="flex items-center justify-center gap-3">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting to TikTok...
              </span>
            ) : state.postStatus === "posted" ? (
              "Posted to TikTok ✓"
            ) : (
              "Post to TikTok 🚀"
            )}
          </button>
          {state.postStatus === "error" && state.postError && (
            <p className="text-red-400 text-xs text-center">{state.postError}</p>
          )}
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

function PipelineProgress({
  taskRunId,
  runStatus,
}: {
  taskRunId: string;
  runStatus?: RunStatus;
}) {
  const steps =
    runStatus?.steps?.length ?
      runStatus.steps
    : PIPELINE_STEPS.map((step) => ({ ...step, status: "pending" as const }));

  return (
    <div className="relative overflow-hidden p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/80 to-transparent animate-pulse" />
      <p className="text-xs text-gray-500 mb-3 font-mono">run: {taskRunId.slice(0, 16)}...</p>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={step.name}
            className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-500 ${
              step.status === "running" ? "bg-pink-500/10 translate-x-1" : ""
            }`}
            style={{ transitionDelay: `${i * 35}ms` }}
          >
            <StepDot status={step.status} />
            <span
              className={`text-xs transition-colors duration-300 ${
                step.status === "succeeded" ? "text-emerald-300"
                : step.status === "running" ? "text-pink-200"
                : step.status === "failed" ? "text-red-300"
                : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-3">Pipeline running on Render Workflows...</p>
    </div>
  );
}

function StepDot({ status }: { status: StepStatus["status"] }) {
  if (status === "succeeded") {
    return (
      <span className="grid w-4 h-4 place-items-center rounded-full bg-emerald-500 text-[10px] text-gray-950 font-bold shrink-0 transition-all duration-300">
        ✓
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="grid w-4 h-4 place-items-center rounded-full bg-red-500 text-[10px] text-white font-bold shrink-0">
        !
      </span>
    );
  }

  if (status === "running") {
    return (
      <span className="relative grid w-4 h-4 place-items-center shrink-0">
        <span className="absolute inset-0 rounded-full bg-pink-400 opacity-60 animate-ping" />
        <span className="relative w-2.5 h-2.5 rounded-full bg-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.85)] animate-pulse" />
      </span>
    );
  }

  return <span className="w-2 h-2 ml-1 rounded-full bg-gray-700 shrink-0 transition-colors" />;
}
