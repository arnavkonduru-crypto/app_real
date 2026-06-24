"use client";
import { useState } from "react";
import { PlannedActivity, Weather } from "@/lib/types";
import Button from "@/components/ui/Button";

interface Props {
  activity: PlannedActivity;
  weather: Weather;
  onFinish: (id: string, intensity: "light" | "moderate" | "hard", extraOz: number) => void;
  onClose: () => void;
}

function calcOz(durationMin: number, intensity: "light" | "moderate" | "hard", weather: Weather): number {
  const base = intensity === "light" ? 8 : intensity === "moderate" ? 12 : 20;
  let oz = (base / 60) * durationMin;
  if (weather.tempF >= 85) oz *= 1.25;
  if (weather.humidity >= 70) oz *= 1.1;
  return Math.round(oz);
}

function parseMinutes(start: string, end: string): number {
  const parse = (t: string) => {
    const [time, ampm] = t.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };
  return Math.max(0, parse(end) - parse(start));
}

export default function FinishActivityModal({ activity, weather, onFinish, onClose }: Props) {
  const [intensity, setIntensity] = useState<"light" | "moderate" | "hard">("moderate");
  const durationMin = parseMinutes(activity.startTime, activity.endTime);
  const oz = calcOz(durationMin, intensity, weather);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5">
        <h3 className="text-xl font-bold text-gray-800">
          {activity.emoji} Great work!
        </h3>
        <p className="text-sm text-gray-500">
          How hard was your {activity.sport}?
        </p>

        <div className="flex gap-2">
          {(["light", "moderate", "hard"] as const).map((i) => (
            <button
              key={i}
              onClick={() => setIntensity(i)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${
                intensity === i
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-500">Extra hydration added</p>
          <p className="text-2xl font-bold text-blue-600">+{oz} oz</p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => onFinish(activity.id, intensity, oz)} className="flex-1">Done</Button>
        </div>
      </div>
    </div>
  );
}
