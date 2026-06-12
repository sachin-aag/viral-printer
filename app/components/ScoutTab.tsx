"use client";

import { useState } from "react";

interface ScoutIdea {
  title: string;
  angle: string;
  sourceUrl?: string;
  sourceName?: string;
  viralScore: number;
}

interface ScoutResult {
  currentAffairs: ScoutIdea[];
  thoughtPieces: ScoutIdea[];
  tiktokTrends: ScoutIdea[];
  fetchedAt: string;
}

interface Props {
  niche: string;
  onSelectIdea: (idea: string) => void;
}

const SECTION_META: { key: keyof Omit<ScoutResult, "fetchedAt">; label: string; icon: string; color: string }[] = [
  { key: "currentAffairs", label: "Current Affairs", icon: "📰", color: "border-blue-500/30 bg-blue-500/5" },
  { key: "thoughtPieces", label: "Thought Pieces", icon: "🧠", color: "border-purple-500/30 bg-purple-500/5" },
  { key: "tiktokTrends", label: "TikTok Trends", icon: "🔥", color: "border-pink-500/30 bg-pink-500/5" },
];

export function ScoutTab({ niche, onSelectIdea }: Props) {
  const [result, setResult] = useState<ScoutResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function scout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/scout?niche=${encodeURIComponent(niche)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: ScoutResult = await res.json();
      setResult(data);
    } catch {
      setError("Failed to fetch ideas. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Scout Ideas</h2>
          <p className="text-sm text-gray-400">
            Real-time trends from HN, The Verge, Reddit & more — filtered for{" "}
            <span className="text-pink-400">{niche}</span>
          </p>
        </div>
        <button
          onClick={scout}
          disabled={loading}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scouting...
            </>
          ) : (
            "Scout now"
          )}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!result && !loading && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">Click "Scout now" to scan live sources for viral angles</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <p className="text-xs text-gray-500">
            Last scouted: {new Date(result.fetchedAt).toLocaleTimeString()}
          </p>

          {SECTION_META.map(({ key, label, icon, color }) => {
            const ideas = result[key];
            if (!ideas || ideas.length === 0) return null;

            return (
              <section key={key} className={`border rounded-xl p-4 ${color}`}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span>{icon}</span> {label}
                </h3>
                <div className="space-y-2">
                  {ideas.map((idea, i) => (
                    <IdeaCard key={i} idea={idea} onSelect={onSelectIdea} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onSelect }: { idea: ScoutIdea; onSelect: (s: string) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-gray-900/60 rounded-lg hover:bg-gray-900 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{idea.title}</p>
          <ViralBadge score={idea.viralScore} />
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">{idea.angle}</p>
        {idea.sourceName && (
          <p className="text-gray-600 text-xs mt-1">
            via {idea.sourceUrl ? (
              <a href={idea.sourceUrl} target="_blank" rel="noopener" className="hover:text-gray-400 underline">
                {idea.sourceName}
              </a>
            ) : idea.sourceName}
          </p>
        )}
      </div>
      <button
        onClick={() => onSelect(`${idea.title}: ${idea.angle}`)}
        className="shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-pink-600 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        Use →
      </button>
    </div>
  );
}

function ViralBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "bg-green-500/20 text-green-400" :
    score >= 5 ? "bg-yellow-500/20 text-yellow-400" :
    "bg-gray-500/20 text-gray-400";

  return (
    <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${color}`}>
      {score}/10
    </span>
  );
}
