"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little or no exercise, desk job", emoji: "🪑" },
  { id: "light", label: "Lightly Active", desc: "Light exercise 1–3 days/week", emoji: "🚶" },
  { id: "moderate", label: "Moderately Active", desc: "Moderate exercise 3–5 days/week", emoji: "🏃" },
  { id: "very", label: "Very Active", desc: "Hard exercise 6–7 days/week", emoji: "🏋️" },
  { id: "athlete", label: "Athlete", desc: "Intense training or physical job", emoji: "⚡" },
];

interface Props {
  onSubmit: (level: string) => void;
  onBack: () => void;
  preferredName?: string;
}

export default function ActivityLevelForm({ onSubmit, onBack, preferredName }: Props) {
  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">
        {preferredName ? `${preferredName}, what's your usual activity level?` : "What's your usual activity level?"}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        This helps us set your baseline hydration needs.
      </p>

      <div className="space-y-3 mb-6">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            onClick={() => onSubmit(level.id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
          >
            <span className="text-2xl">{level.emoji}</span>
            <div>
              <div className="font-semibold text-gray-800 group-hover:text-blue-700">{level.label}</div>
              <div className="text-xs text-gray-500">{level.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <Button variant="secondary" onClick={onBack} className="w-full">
        ← Back
      </Button>
    </Card>
  );
}
