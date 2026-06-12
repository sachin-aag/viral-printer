"use client";

import { useState, useEffect } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { ScoutTab } from "./ScoutTab";
import { CreateTab } from "./CreateTab";
import { HistoryTab } from "./HistoryTab";
import type { Profile } from "@/lib/types";

type Tab = "scout" | "create" | "history";

const PROFILE_KEY = "vp_profile";

export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function saveProfile(p: Profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }

  function handleSelectIdea(idea: string) {
    setPendingPrompt(idea);
    setActiveTab("create");
  }

  function handleGenerated() {
    setHistoryKey((k) => k + 1);
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "scout", label: "Scout", emoji: "🔍" },
    { id: "create", label: "Create", emoji: "✨" },
    { id: "history", label: "History", emoji: "📋" },
  ];

  return (
    <>
      {!profile && <OnboardingModal onSave={saveProfile} />}

      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/viralprinter-icon.png" alt="ViralPrinter" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-white">ViralPrinter</span>
          </div>
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-full">
                {profile.niche}
              </span>
              <button
                onClick={() => setProfile(null)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Edit profile
              </button>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-800 px-4">
          <div className="flex gap-1 max-w-2xl mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-pink-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
          {activeTab === "scout" && profile && (
            <ScoutTab niche={profile.niche} onSelectIdea={handleSelectIdea} />
          )}
          {activeTab === "create" && profile && (
            <CreateTab
              key={pendingPrompt}
              profile={profile}
              initialPrompt={pendingPrompt}
              onGenerated={handleGenerated}
            />
          )}
          {activeTab === "history" && (
            <HistoryTab key={historyKey} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-900 px-4 py-3 text-center space-y-1">
          <p className="text-xs text-gray-700">
            Powered by{" "}
            <span className="text-gray-600">Render · Anthropic · Composio · ElevenLabs · AWS · ClickHouse</span>
          </p>
          <p className="text-xs text-gray-600">
            <a href="/privacy" className="hover:text-gray-400">Privacy Policy</a>
            {" · "}
            <a href="/terms" className="hover:text-gray-400">Terms of Service</a>
          </p>
        </footer>
      </div>
    </>
  );
}
