"use client";
import { useState } from "react";
import { LoggedActivity, Weather } from "@/lib/types";
import { ACTIVITY_LIST } from "@/components/activities/ACTIVITIES";
import Button from "@/components/ui/Button";

interface Props {
  weather: Weather;
  onAdd: (activity: LoggedActivity) => void;
  onClose: () => void;
}

const DURATIONS = [15, 30, 45, 60, 90, 120];

function calcExtraOz(durationMin: number, intensity: "light" | "moderate" | "hard", weather: Weather): number {
  const base = intensity === "light" ? 8 : intensity === "moderate" ? 12 : 20;
  const perMin = base / 60;
  let oz = perMin * durationMin;
  if (weather.tempF >= 85) oz *= 1.25;
  if (weather.humidity >= 70) oz *= 1.1;
  return Math.round(oz);
}

export default function AddActivityModal({ weather, onAdd, onClose }: Props) {
  const [sport, setSport] = useState<typeof ACTIVITY_LIST[number]>(ACTIVITY_LIST[0]);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState<"light" | "moderate" | "hard">("moderate");

  const extraOz = calcExtraOz(duration, intensity, weather);

  const handleAdd = () => {
    onAdd({
      id: crypto.randomUUID(),
      sport: sport.name,
      emoji: sport.emoji,
      durationMin: duration,
      intensity,
      extraOz,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5">
        <h3 className="text-xl font-bold text-gray-800">Add Activity</h3>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Activity</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_LIST.map((a) => (
              <button
                key={a.id}
                onClick={() => setSport(a)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  sport.id === a.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{a.emoji}</span> {a.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Duration</p>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                  duration === d
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Intensity</p>
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
        </div>

        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-500">Extra hydration needed</p>
          <p className="text-2xl font-bold text-blue-600">+{extraOz} oz</p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleAdd} className="flex-1">Add to Plan</Button>
        </div>
      </div>
    </div>
  );
}
