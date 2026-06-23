"use client";

const STEPS = ["Profile", "Activities", "Weather", "Results"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? "bg-blue-500 text-white" : active ? "bg-blue-100 border-2 border-blue-500 text-blue-600" : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"}`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-medium ${active ? "text-blue-600" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mb-5 ${done ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
