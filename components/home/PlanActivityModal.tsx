"use client";
import { useState } from "react";
import { PlannedActivity, Weather } from "@/lib/types";
import { ACTIVITY_LIST } from "@/components/activities/ACTIVITIES";
import { calcActivityOz } from "@/lib/hydration";
import Button from "@/components/ui/Button";

interface Props {
  weather: Weather;
  onPlan: (activity: PlannedActivity) => void;
  onClose: () => void;
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
}

function fmt12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function PlanActivityModal({ weather, onPlan, onClose }: Props) {
  const [sport, setSport] = useState<typeof ACTIVITY_LIST[number]>(ACTIVITY_LIST[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const durationMin = timeDiffMinutes(startTime, endTime);
  // Estimate assumes moderate intensity; recalculated when the user finishes.
  const extraOz = durationMin > 0 ? calcActivityOz(sport.id, durationMin, "moderate", weather) : 0;

  const handlePlan = () => {
    if (durationMin <= 0) return;
    onPlan({
      id: crypto.randomUUID(),
      sportId: sport.id,
      sport: sport.name,
      emoji: sport.emoji,
      startTime: fmt12(startTime),
      endTime: fmt12(endTime),
      finished: false,
      extraOz,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5">
        <h3 className="text-xl font-bold text-gray-800">Plan Activity</h3>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Start Time</p>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">End Time</p>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {durationMin > 0 && (
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-sm text-gray-500">{durationMin} min · estimated extra hydration</p>
            <p className="text-2xl font-bold text-blue-600">+{extraOz} oz</p>
            <p className="text-xs text-gray-400 mt-1">Intensity and final amount set when you finish</p>
          </div>
        )}

        {durationMin <= 0 && (
          <p className="text-sm text-red-400 text-center">End time must be after start time</p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handlePlan} disabled={durationMin <= 0} className="flex-1">Add to Plan</Button>
        </div>
      </div>
    </div>
  );
}
