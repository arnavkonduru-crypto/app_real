"use client";
import { useState } from "react";
import { Activity } from "@/lib/types";
import { ACTIVITY_LIST } from "./ACTIVITIES";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Props {
  onSubmit: (activities: Activity[]) => void;
  onBack: () => void;
}

export default function ActivityPicker({ onSubmit, onBack }: Props) {
  const [selected, setSelected] = useState<Activity[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.find((a) => a.id === id)) return prev.filter((a) => a.id !== id);
      const def = ACTIVITY_LIST.find((a) => a.id === id)!;
      return [...prev, { ...def, durationMin: 30, intensity: "moderate" }];
    });
  };

  const update = (id: string, key: "durationMin" | "intensity", value: string | number) =>
    setSelected((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [key]: value } : a))
    );

  const isSelected = (id: string) => !!selected.find((a) => a.id === id);

  return (
    <Card className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">
        What are you doing today?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Select all activities. We&apos;ll factor in sweat loss for each.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {ACTIVITY_LIST.map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={() => toggle(act.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
              ${isSelected(act.id)
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300"}`}
          >
            <span>{act.emoji}</span>
            <span>{act.name}</span>
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Adjust details
          </h3>
          {selected.map((act) => (
            <div
              key={act.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
            >
              <span className="font-medium text-sm text-gray-700 dark:text-gray-200 w-28">
                {act.emoji} {act.name}
              </span>
              <label className="flex items-center gap-1 text-sm text-gray-500">
                <input
                  type="number"
                  value={act.durationMin}
                  min={5}
                  max={360}
                  step={5}
                  onChange={(e) => update(act.id, "durationMin", Number(e.target.value))}
                  className="input w-16 text-center"
                />
                min
              </label>
              <div className="flex gap-1">
                {(["light", "moderate", "hard"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => update(act.id, "intensity", lvl)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium capitalize transition-all
                      ${act.intensity === lvl
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={() => onSubmit(selected)} className="flex-1">
          Next →
        </Button>
      </div>
    </Card>
  );
}
