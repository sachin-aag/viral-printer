"use client";

import { useState } from "react";

interface PostAnalytics {
  id: string;
  hook: string;
  postedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  avgWatchTime: number;
  completionRate: number;
  topComments: { user: string; text: string; likes: number }[];
  summary: string;
  suggestions: string[];
}

const MOCK_POSTS: PostAnalytics[] = [
  {
    id: "1",
    hook: "Scientists just discovered your brain does THIS while you sleep...",
    postedAt: "2025-06-10T14:30:00Z",
    views: 284_000,
    likes: 31_200,
    comments: 1_840,
    shares: 4_120,
    saves: 8_900,
    avgWatchTime: 42,
    completionRate: 78,
    topComments: [
      { user: "@neurosciencenerd", text: "Finally someone explained this properly. The glymphatic system is wild.", likes: 342 },
      { user: "@skeptic101", text: "Source? This sounds too good to be true", likes: 187 },
      { user: "@studywithme.sara", text: "This is why I stopped pulling all-nighters. Sleep > cramming", likes: 521 },
      { user: "@dr.brain.facts", text: "As a neuroscientist, this is actually accurate. Well done.", likes: 1_203 },
      { user: "@fitlife_jake", text: "Bro no wonder I feel dumb after 4 hours of sleep lmao", likes: 89 },
    ],
    summary: "Strong virality driven by the curiosity hook and expert validation in comments. The 78% completion rate is well above your niche average of 52%. Comment sentiment is 72% positive with high engagement from credentialed accounts, which boosts algorithmic reach.",
    suggestions: [
      "Create a Part 2 diving into the glymphatic system — commenters are asking for more depth",
      "Pin the neuroscientist's comment to boost credibility and encourage more expert engagement",
      "Post a follow-up at the same time slot (2:30 PM EST) — this time consistently outperforms for your niche",
      "Repurpose the top-performing hook structure ('Scientists just discovered X does THIS') for your next 2 videos",
    ],
  },
  {
    id: "2",
    hook: "Why 99% of people will never build real wealth (it's not what you think)",
    postedAt: "2025-06-08T18:00:00Z",
    views: 152_000,
    likes: 14_800,
    comments: 3_210,
    shares: 2_900,
    saves: 6_700,
    avgWatchTime: 38,
    completionRate: 64,
    topComments: [
      { user: "@hustlequeen", text: "Not the ragebait title 💀 but honestly the content is solid", likes: 892 },
      { user: "@finance.bro.matt", text: "The part about lifestyle inflation is SO underrated. Nobody talks about this.", likes: 445 },
      { user: "@angrycommenter", text: "Easy to say when you already have money. Tone deaf.", likes: 1_102 },
      { user: "@savvy.saver", text: "Saved this. Literally me spending $7 on oat milk lattes daily 😭", likes: 234 },
    ],
    summary: "High comment-to-view ratio (2.1%) indicates strong opinion-driving content. The ragebait hook generated polarized reactions — negative comments actually boosted reach through engagement signals. Shares are solid but saves outperform, suggesting utility value. Completion rate dropped 14% from your last post, likely due to mid-video pacing.",
    suggestions: [
      "Address the 'tone deaf' criticism in a response video — controversy reply content averages 2.3x views in your niche",
      "Tighten the middle 15 seconds — analytics show a 22% drop-off at the 18-second mark",
      "The 'lifestyle inflation' angle resonated most — consider a dedicated deep-dive video",
      "Reduce transition duration to keep pacing snappy; current 1.5s transitions may be causing mid-video bounce",
    ],
  },
  {
    id: "3",
    hook: "I tracked every minute of my day for 30 days. Here's what I found.",
    postedAt: "2025-06-05T10:15:00Z",
    views: 89_400,
    likes: 9_100,
    comments: 670,
    shares: 1_800,
    saves: 4_200,
    avgWatchTime: 51,
    completionRate: 85,
    topComments: [
      { user: "@productivitypete", text: "The screen time breakdown was eye opening. Doing this starting tomorrow.", likes: 156 },
      { user: "@minimalist.liv", text: "3 hours a day on your phone?? That's actually low compared to most people", likes: 78 },
      { user: "@data.nerd.sam", text: "Love the visualization. What tool did you use to track?", likes: 312 },
    ],
    summary: "Highest completion rate across all your posts at 85%, indicating excellent content-hook alignment. Lower view count suggests the storytelling hook style has narrower initial reach but much deeper engagement. Save rate of 4.7% is exceptional — this content has strong evergreen potential.",
    suggestions: [
      "Boost this post — the high completion rate signals strong algorithmic potential that hasn't peaked yet",
      "Reply to the tool question with a pinned comment linking your setup — drives profile visits",
      "This storytelling format works well for deep engagement; alternate it with curiosity hooks for reach balance",
      "Create a template/downloadable tracker and link it in bio — the save rate suggests people want to replicate this",
    ],
  },
  {
    id: "4",
    hook: "Stop satisfying the interviewer. Start doing THIS instead.",
    postedAt: "2025-06-02T16:45:00Z",
    views: 41_200,
    likes: 3_400,
    comments: 290,
    shares: 890,
    saves: 1_600,
    avgWatchTime: 29,
    completionRate: 48,
    topComments: [
      { user: "@jobseeker2025", text: "Wish I saw this before my interview yesterday 😩", likes: 67 },
      { user: "@hr.insider", text: "As someone who interviews candidates, can confirm this works", likes: 198 },
    ],
    summary: "Underperformed relative to your average. The hook lacked specificity — 'THIS' without a stronger curiosity gap led to lower click-through. The 48% completion rate suggests the payoff didn't match the hook's promise. However, HR professional engagement adds credibility value.",
    suggestions: [
      "Rework the hook to be more specific: 'The interview trick that got me 3 offers in 2 weeks' would create a stronger curiosity gap",
      "Front-load the key insight — viewers are dropping before the payoff at second 22",
      "Duet or stitch with the HR insider's comment to create a credibility-boosted follow-up",
      "Consider switching from b-roll to brainrot mode for career content — it performs 34% better in engagement for this topic",
    ],
  },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function AnalyticsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(MOCK_POSTS[0].id);

  const totals = MOCK_POSTS.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      shares: acc.shares + p.shares,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 }
  );

  const avgCompletion = Math.round(
    MOCK_POSTS.reduce((s, p) => s + p.completionRate, 0) / MOCK_POSTS.length
  );

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Views", value: fmt(totals.views), color: "text-blue-400" },
            { label: "Total Likes", value: fmt(totals.likes), color: "text-pink-400" },
            { label: "Total Comments", value: fmt(totals.comments), color: "text-amber-400" },
            { label: "Avg Completion", value: `${avgCompletion}%`, color: "text-green-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-post breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Post Breakdown</h2>
        <div className="space-y-3">
          {MOCK_POSTS.map((post) => {
            const isExpanded = expandedId === post.id;
            return (
              <div
                key={post.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                {/* Collapsed row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : post.id)}
                  className="w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-white text-sm font-medium flex-1 line-clamp-1">
                      {post.hook}
                    </p>
                    <span className="shrink-0 text-xs text-gray-500">{timeAgo(post.postedAt)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{fmt(post.views)} views</span>
                    <span>{fmt(post.likes)} likes</span>
                    <span>{fmt(post.comments)} comments</span>
                    <span className={`ml-auto font-medium ${
                      post.completionRate >= 70 ? "text-green-400" :
                      post.completionRate >= 50 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {post.completionRate}% watched
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 space-y-5">
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Views", value: fmt(post.views) },
                        { label: "Likes", value: fmt(post.likes) },
                        { label: "Comments", value: fmt(post.comments) },
                        { label: "Shares", value: fmt(post.shares) },
                        { label: "Saves", value: fmt(post.saves) },
                        { label: "Avg Watch", value: `${post.avgWatchTime}s` },
                      ].map((s) => (
                        <div key={s.label} className="text-center bg-gray-800/50 rounded-lg py-2 px-1">
                          <p className="text-xs text-gray-500">{s.label}</p>
                          <p className="text-sm font-semibold text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Completion bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Completion Rate</span>
                        <span className={`text-xs font-medium ${
                          post.completionRate >= 70 ? "text-green-400" :
                          post.completionRate >= 50 ? "text-amber-400" : "text-red-400"
                        }`}>{post.completionRate}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            post.completionRate >= 70 ? "bg-green-500" :
                            post.completionRate >= 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${post.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">AI Summary</h4>
                      <p className="text-sm text-gray-400 leading-relaxed bg-gray-800/40 rounded-lg p-3 border border-gray-800">
                        {post.summary}
                      </p>
                    </div>

                    {/* Top Comments */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">
                        Top Comments
                        <span className="text-gray-600 font-normal ml-1">({post.topComments.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {post.topComments.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="flex-1 min-w-0">
                              <span className="text-pink-400 font-medium text-xs">{c.user}</span>
                              <p className="text-gray-400 text-xs mt-0.5">{c.text}</p>
                            </div>
                            <span className="shrink-0 text-xs text-gray-600 flex items-center gap-0.5">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                              </svg>
                              {fmt(c.likes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Suggestions</h4>
                      <ul className="space-y-2">
                        {post.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                            <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center text-[10px] font-bold">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
