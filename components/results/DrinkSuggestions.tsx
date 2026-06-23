"use client";
import { HydrationResult } from "@/lib/types";

export default function DrinkSuggestions({ result }: { result: HydrationResult }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
        🥤 Drink Suggestions
      </h3>
      <ul className="space-y-2">
        {result.drinkSuggestions.map((s, i) => (
          <li
            key={i}
            className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
          >
            <span className="text-blue-400 mt-0.5">•</span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
