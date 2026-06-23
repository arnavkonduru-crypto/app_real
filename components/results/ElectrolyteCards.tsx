"use client";
import { HydrationResult } from "@/lib/types";

export default function ElectrolyteCards({ result }: { result: HydrationResult }) {
  const items = [
    { label: "Sodium", value: result.sodiumMg, unit: "mg", color: "amber", emoji: "🧂" },
    { label: "Potassium", value: result.potassiumMg, unit: "mg", color: "green", emoji: "🍌" },
    { label: "Magnesium", value: result.magnesiumMg, unit: "mg", color: "purple", emoji: "💊" },
  ];

  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl p-3 text-center ${colorMap[item.color]}`}>
          <div className="text-2xl mb-1">{item.emoji}</div>
          <div className="text-xl font-bold">{item.value}</div>
          <div className="text-xs opacity-70">{item.unit}</div>
          <div className="text-xs font-medium mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
