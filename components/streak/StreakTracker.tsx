"use client";
import { useEffect, useState } from "react";
import { loadStreakData, saveStreak } from "@/lib/storage";

export default function StreakTracker() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    saveStreak();
    setStreak(loadStreakData().count);
  }, []);

  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-orange-500">
      🔥 {streak} day{streak !== 1 ? "s" : ""} streak
    </div>
  );
}
