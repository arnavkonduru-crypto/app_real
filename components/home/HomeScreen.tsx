"use client";
import { useState } from "react";
import { UserProfile, Weather, HydrationResult, PlannedActivity, LoggedActivity } from "@/lib/types";
import Button from "@/components/ui/Button";
import AddActivityModal from "./AddActivityModal";
import PlanActivityModal from "./PlanActivityModal";
import FinishActivityModal from "./FinishActivityModal";

interface Props {
  profile: UserProfile;
  weather: Weather;
  preferredName: string;
}

const OUTDOOR_OPTIONS = [
  { label: "None", hours: 0 },
  { label: "< 1 hr", hours: 0.5 },
  { label: "1–2 hrs", hours: 1.5 },
  { label: "2–4 hrs", hours: 3 },
  { label: "4+ hrs", hours: 5 },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen({ profile, weather, preferredName }: Props) {
  const [phase, setPhase] = useState<"outdoor" | "loading" | "dashboard">("outdoor");
  const [outdoorHours, setOutdoorHours] = useState<number | null>(null);
  const [baseline, setBaseline] = useState<HydrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loggedActivities, setLoggedActivities] = useState<LoggedActivity[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [finishTarget, setFinishTarget] = useState<PlannedActivity | null>(null);

  const totalLoggedOz = loggedActivities.reduce((s, a) => s + a.extraOz, 0);
  const totalPlannedOz = plannedActivities.filter(a => a.finished).reduce((s, a) => s + a.extraOz, 0);
  const totalOz = (baseline?.waterOz ?? 0) + totalLoggedOz + totalPlannedOz;

  const fetchBaseline = async (hours: number) => {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/hydration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, weather, outdoorHours: hours }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBaseline(data);
      setPhase("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("outdoor");
    }
  };

  const handleOutdoorSelect = (hours: number) => {
    setOutdoorHours(hours);
    fetchBaseline(hours);
  };

  const handleAddActivity = (act: LoggedActivity) => {
    setLoggedActivities((prev) => [...prev, act]);
  };

  const handlePlanActivity = (act: PlannedActivity) => {
    setPlannedActivities((prev) => [...prev, act].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  const handleFinish = (id: string, intensity: "light" | "moderate" | "hard", extraOz: number) => {
    setPlannedActivities((prev) =>
      prev.map((a) => a.id === id ? { ...a, finished: true, intensity, extraOz } : a)
    );
    setFinishTarget(null);
  };

  if (phase === "outdoor") {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{getGreeting()}, {preferredName}.</h2>
          <p className="text-gray-500 text-sm mt-1">Let&apos;s build your hydration plan for today.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-4xl">{weather.tempF >= 85 ? "☀️" : weather.tempF >= 70 ? "🌤" : "🌥"}</div>
          <p className="font-semibold text-gray-700">{Math.round(weather.tempF)}°F · {weather.humidity}% humidity</p>
          <p className="text-sm text-gray-500 font-medium">How long will you be outside today? <span className="text-gray-400">(general errands, walking, etc.)</span></p>

          <div className="grid grid-cols-3 gap-2">
            {OUTDOOR_OPTIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => handleOutdoorSelect(o.hours)}
                className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="text-4xl animate-bounce">💧</div>
        <p className="text-gray-500">Calculating your personalized plan…</p>
      </div>
    );
  }

  if (!baseline) return null;

  const pendingPlanned = plannedActivities.filter((a) => !a.finished);
  const finishedPlanned = plannedActivities.filter((a) => a.finished);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {showAdd && <AddActivityModal weather={weather} onAdd={handleAddActivity} onClose={() => setShowAdd(false)} />}
      {showPlan && <PlanActivityModal weather={weather} onPlan={handlePlanActivity} onClose={() => setShowPlan(false)} />}
      {finishTarget && (
        <FinishActivityModal
          activity={finishTarget}
          weather={weather}
          onFinish={handleFinish}
          onClose={() => setFinishTarget(null)}
        />
      )}

      {/* Greeting + baseline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-2">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{getGreeting()}, {preferredName}</p>
        <p className="text-gray-500 text-sm">Today&apos;s hydration target</p>
        <div className="text-6xl font-black text-blue-600">{totalOz} <span className="text-3xl font-semibold">oz</span></div>
        <p className="text-xs text-gray-400">{Math.round(totalOz * 29.5735)} mL · {Math.round(weather.tempF)}°F outside</p>
        <p className="text-sm text-gray-500 mt-2 italic">{baseline.reasoning}</p>
      </div>

      {/* Electrolytes */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sodium", value: baseline.sodiumMg, unit: "mg" },
          { label: "Potassium", value: baseline.potassiumMg, unit: "mg" },
          { label: "Magnesium", value: baseline.magnesiumMg, unit: "mg" },
        ].map((e) => (
          <div key={e.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className="text-lg font-bold text-gray-700">{e.value}</div>
            <div className="text-xs text-gray-400">{e.label} {e.unit}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowAdd(true)}
          className="bg-white border-2 border-blue-200 rounded-2xl p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-semibold text-gray-800 text-sm">Add Activity</div>
          <div className="text-xs text-gray-400 mt-0.5">Already did or doing now</div>
        </button>
        <button
          onClick={() => setShowPlan(true)}
          className="bg-white border-2 border-purple-200 rounded-2xl p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors shadow-sm"
        >
          <div className="text-2xl mb-1">📅</div>
          <div className="font-semibold text-gray-800 text-sm">Plan Activity</div>
          <div className="text-xs text-gray-400 mt-0.5">Schedule for later today</div>
        </button>
      </div>

      {/* Logged activities */}
      {loggedActivities.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-sm font-semibold text-gray-600">Completed</p>
          {loggedActivities.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span>{a.emoji} {a.sport} · {a.durationMin}m · {a.intensity}</span>
              <span className="text-blue-600 font-semibold">+{a.extraOz} oz</span>
            </div>
          ))}
          {finishedPlanned.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span>{a.emoji} {a.sport} · {a.startTime}–{a.endTime} · {a.intensity}</span>
              <span className="text-blue-600 font-semibold">+{a.extraOz} oz</span>
            </div>
          ))}
        </div>
      )}

      {/* Daily plan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-600">Today&apos;s Schedule</p>

        {/* Planned (unfinished) activities */}
        {pendingPlanned.map((a) => (
          <div key={a.id} className="border border-purple-200 bg-purple-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-purple-800 text-sm">{a.emoji} {a.sport}</span>
                <span className="text-xs text-purple-500 ml-2">{a.startTime} – {a.endTime}</span>
              </div>
              <span className="text-purple-600 font-semibold text-sm">~+{a.extraOz} oz</span>
            </div>
            <div className="text-xs text-purple-600 space-y-0.5">
              <div>💧 Drink 8 oz 30 min before</div>
              <div>💧 Sip 4–6 oz every 15–20 min during</div>
              <div>💧 Drink 8–12 oz within 30 min after</div>
            </div>
            <button
              onClick={() => setFinishTarget(a)}
              className="w-full py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              I Finished This Activity
            </button>
          </div>
        ))}

        {/* Baseline hourly schedule */}
        <div className="space-y-1.5">
          {baseline.hourlySchedule.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 w-20 shrink-0">{s.time}</span>
              <div className="flex-1 bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, (s.oz / 16) * 100)}%` }}
                />
              </div>
              <span className="text-blue-600 font-medium w-10 text-right">{s.oz} oz</span>
              <span className="text-gray-400 text-xs hidden sm:block">{s.note}</span>
            </div>
          ))}
        </div>

        {/* Drink suggestions */}
        {baseline.drinkSuggestions?.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-1">DRINK SUGGESTIONS</p>
            <ul className="text-sm text-gray-600 space-y-0.5">
              {baseline.drinkSuggestions.map((s, i) => <li key={i}>· {s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
