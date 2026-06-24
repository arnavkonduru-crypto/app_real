"use client";
import { useEffect } from "react";

interface Props {
  streak: number;
  onClose: () => void;
}

const CONFETTI = Array.from({ length: 40 });

export default function GoalReachedOverlay({ streak, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-hidden cursor-pointer"
    >
      {/* Confetti */}
      {CONFETTI.map((_, i) => {
        const left = (i * 37) % 100;
        const delay = (i % 10) * 0.15;
        const colors = ["#3b82f6", "#60a5fa", "#22c55e", "#f59e0b", "#a855f7"];
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute top-0 block w-2 h-3 rounded-sm animate-confetti"
            style={{ left: `${left}%`, backgroundColor: color, animationDelay: `${delay}s` }}
          />
        );
      })}

      <div className="relative bg-white rounded-3xl px-10 py-12 text-center shadow-2xl animate-pop max-w-sm mx-4">
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-3xl font-black text-blue-600 mb-2">Goal Reached!</h2>
        <p className="text-gray-500 mb-4">You hit your hydration target for today. Amazing work staying hydrated!</p>
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-500 font-bold px-4 py-2 rounded-full">
          🔥 {streak} day{streak !== 1 ? "s" : ""} streak
        </div>
        <p className="text-xs text-gray-300 mt-6">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
