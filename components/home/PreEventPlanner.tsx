"use client";
import { useState } from "react";
import { UserProfile, Weather } from "@/lib/types";
import Button from "@/components/ui/Button";

interface Props {
  profile: UserProfile;
  weather: Weather;
}

interface EventPlan {
  days: { label: string; targetOz: number; sodiumMg: number; tips: string[] }[];
  eventDay: { time: string; action: string }[];
  summary: string;
}

const EVENT_TYPES = [
  { id: "race", label: "Race / Run", emoji: "🏃" },
  { id: "game", label: "Game / Match", emoji: "⚽" },
  { id: "hike", label: "Long Hike", emoji: "🥾" },
  { id: "ride", label: "Cycling Event", emoji: "🚴" },
  { id: "tournament", label: "Tournament", emoji: "🏆" },
  { id: "other", label: "Other", emoji: "📌" },
];

function daysBetween(target: string): number {
  // target is "YYYY-MM-DD"; compute whole days from today
  const [y, m, d] = target.split("-").map(Number);
  const event = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((event.getTime() - today.getTime()) / 86400000));
}

export default function PreEventPlanner({ profile, weather }: Props) {
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!eventDate) {
      setError("Pick an event date first.");
      return;
    }
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/event-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          weather,
          eventName,
          eventType: eventType.label,
          daysUntil: daysBetween(eventDate),
          eventTime,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Got a race, game, or big hike coming up? Get a day-by-day hydration ramp-up plan.
      </p>

      {/* Event type */}
      <div className="grid grid-cols-3 gap-2">
        {EVENT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setEventType(t)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-colors ${
              eventType.id === t.id
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <span className="text-lg">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        placeholder="Event name (optional)"
        className="input"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Start time</p>
          <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="input" />
        </div>
      </div>

      <Button onClick={generate} disabled={loading} className="w-full">
        {loading ? "Building your plan…" : "Generate Plan"}
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Generated plan */}
      {plan && (
        <div className="space-y-4 pt-2">
          {plan.summary && (
            <p className="text-sm text-gray-600 italic bg-blue-50 rounded-xl p-3">{plan.summary}</p>
          )}

          {/* Ramp-up days */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Ramp-Up</p>
            {plan.days.map((d, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{d.label}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{d.targetOz} oz</span>
                    <span className="bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-medium">{d.sodiumMg}mg Na</span>
                  </div>
                </div>
                <ul className="text-xs text-gray-500 space-y-0.5">
                  {d.tips.map((t, j) => <li key={j}>· {t}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {/* Event-day timeline */}
          {plan.eventDay?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Event Day</p>
              <div className="relative pl-6">
                <div className="absolute left-[5px] top-1 bottom-1 w-px bg-purple-200" />
                <div className="space-y-3">
                  {plan.eventDay.map((e, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-purple-100" />
                      <p className="text-sm font-semibold text-purple-700">{e.time}</p>
                      <p className="text-xs text-gray-500">{e.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
