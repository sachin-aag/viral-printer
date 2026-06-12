"use client";

import { useState } from "react";

interface Props {
  niche: string;
  onSelectIdea: (idea: string) => void;
}

export function ScoutTab({ niche, onSelectIdea }: Props) {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function scout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/scout?niche=${encodeURIComponent(niche)}`);
      const data = await res.json();
      setIdeas(data.ideas ?? []);
    } catch {
      setError("Failed to fetch ideas. Check your API key.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Scout Ideas</h2>
          <p className="text-sm text-gray-400">AI-researched viral topics for your <span className="text-pink-400">{niche}</span> account</p>
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
            "Find ideas for me"
          )}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {ideas.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm">Click "Find ideas" to get AI-powered topic suggestions</p>
        </div>
      )}

      <div className="grid gap-3">
        {ideas.map((idea, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group"
          >
            <p className="text-white text-sm flex-1 mr-4">{idea}</p>
            <button
              onClick={() => onSelectIdea(idea)}
              className="shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-pink-600 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
            >
              Use this →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
