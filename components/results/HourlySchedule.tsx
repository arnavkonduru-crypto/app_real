"use client";
import { HydrationResult } from "@/lib/types";

export default function HourlySchedule({ result }: { result: HydrationResult }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
        📅 Hourly Schedule
      </h3>
      <div className="space-y-2">
        {result.hourlySchedule.map((slot, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50"
          >
            <span className="text-xs font-semibold text-blue-500 w-16 shrink-0 pt-0.5">
              {slot.time}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-12 shrink-0">
              {slot.oz} oz
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{slot.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
