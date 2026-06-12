"use client";

import { useEffect, useState } from "react";
import type { PostRecord } from "@/lib/clickhouse";

export function HistoryTab() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHistory(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <span className="inline-block w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin mr-3" />
        Loading history...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-sm">No posts yet. Create your first TikTok!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Post History</h2>
        <button
          onClick={loadHistory}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((post, i) => (
          <div key={i} className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-white text-sm font-medium flex-1 line-clamp-2">{post.hook}</p>
              <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                post.mock ? "bg-yellow-900/50 text-yellow-400" : "bg-green-900/50 text-green-400"
              }`}>
                {post.mock ? "Mock" : "Posted"}
              </span>
            </div>
            <p className="text-gray-500 text-xs mb-2 line-clamp-1">{post.prompt}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                {post.hook_style}
              </span>
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                {post.video_mode}
              </span>
              {post.tiktok_url && (
                <a
                  href={post.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
                >
                  {post.mock ? "Watch video →" : "View on TikTok →"}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
