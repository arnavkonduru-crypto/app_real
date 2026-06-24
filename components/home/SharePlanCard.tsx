"use client";
import { useRef, useState } from "react";
import { Weather } from "@/lib/types";

interface Props {
  preferredName: string;
  totalOz: number;
  bottles: number;
  weather: Weather;
  sodiumMg: number;
  streak: number;
}

export default function SharePlanCard({ preferredName, totalOz, bottles, weather, sodiumMg, streak }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const shareText =
    `💧 My Aqua hydration plan${preferredName ? ` (${preferredName})` : ""}:\n` +
    `Goal: ${totalOz} oz (~${bottles} bottles)\n` +
    `Sodium: ${sodiumMg} mg · ${Math.round(weather.tempF)}°F today` +
    (streak > 0 ? `\n🔥 ${streak} day streak!` : "");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Aqua Hydration Plan", text: shareText });
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
        ref={cardRef}
        className="rounded-2xl p-6 text-white text-center"
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)" }}
      >
        <p className="text-xs uppercase tracking-widest opacity-80">Aqua · Daily Plan</p>
        {preferredName && <p className="text-lg font-semibold mt-1">{preferredName}</p>}
        <div className="text-5xl font-black mt-3">{totalOz} <span className="text-2xl font-semibold">oz</span></div>
        <p className="opacity-90 text-sm mt-1">≈ {bottles} water bottles today</p>
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
        {copied ? "✓ Copied to clipboard!" : "Share My Plan"}
      </button>
    </div>
  );
}
