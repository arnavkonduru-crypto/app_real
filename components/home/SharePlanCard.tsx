"use client";
import { useState } from "react";
import { Weather } from "@/lib/types";

interface Props {
  preferredName: string;
  drankOz: number;
  goalOz: number;
  bottleOz: number;
  weather: Weather;
  sodiumMg: number;
  streak: number;
}

export default function SharePlanCard({ preferredName, drankOz, goalOz, bottleOz, weather, sodiumMg, streak }: Props) {
  const [copied, setCopied] = useState(false);

  const bottlesDrank = bottleOz > 0 ? (drankOz / bottleOz).toFixed(1) : "0";
  const pct = goalOz > 0 ? Math.round((drankOz / goalOz) * 100) : 0;

  const shareText =
    `💧 My Aqua hydration${preferredName ? ` (${preferredName})` : ""}:\n` +
    `Drank ${drankOz} oz today (${pct}% of my ${goalOz} oz goal)\n` +
    `≈ ${bottlesDrank} water bottles · ${Math.round(weather.tempF)}°F` +
    (streak > 0 ? `\n🔥 ${streak} day streak!` : "");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Aqua Hydration", text: shareText });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* The visual card */}
      <div
        className="rounded-2xl p-6 text-white text-center"
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
      >
        <p className="text-xs uppercase tracking-widest opacity-80">Aqua · Today</p>
        {preferredName && <p className="text-lg font-semibold mt-1">{preferredName}</p>}
        <div className="text-5xl font-black mt-3">{drankOz} <span className="text-2xl font-semibold">oz</span></div>
        <p className="opacity-90 text-sm mt-1">drank today · {pct}% of {goalOz} oz goal</p>
        <p className="opacity-80 text-xs mt-0.5">≈ {bottlesDrank} water bottles</p>
        <div className="flex justify-center gap-4 mt-4 text-sm">
          <span>🌡 {Math.round(weather.tempF)}°F</span>
          <span>🧂 {sodiumMg}mg Na</span>
          {streak > 0 && <span>🔥 {streak}d</span>}
        </div>
      </div>

      <button
        onClick={handleShare}
        className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
      >
        {copied ? "✓ Copied to clipboard!" : "Share My Progress"}
      </button>
    </div>
  );
}
