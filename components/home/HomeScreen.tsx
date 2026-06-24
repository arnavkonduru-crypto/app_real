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

const LOG_AMOUNTS = [8, 12, 16, 20];
const BOTTLE_OZ = 16.9;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ProgressRing({ logged, goal }: { logged: number; goal: number }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, logged / goal) : 0;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#dbeafe" strokeWidth="14" />
        <circle
          cx="100" cy="100" r={r} fill="none"
          stroke="#3b82f6" strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text x="100" y="90" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#3b82f6">{logged}</text>
        <text x="100" y="112" textAnchor="middle" fontSize="14" fill="#6b7280">oz</text>
        <text x="100" y="132" textAnchor="middle" fontSize="12" fill="#9ca3af">of {goal} oz goal</text>
      </svg>
      <p className="text-xs text-gray-400">{goal} oz · {Math.round(goal * 29.5735)} ml total goal</p>
    </div>
  );
}

export default function HomeScreen({ profile, weather, preferredName }: Props) {
  const [phase, setPhase] = useState<"outdoor" | "loading" | "dashboard">("outdoor");
  const [baseline, setBaseline] = useState<HydrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [intake, setIntake] = useState(0);
  const [loggedActivities, setLoggedActivities] = useState<LoggedActivity[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [finishTarget, setFinishTarget] = useState<PlannedActivity | null>(null);

  const activityOz =
    loggedActivities.reduce((s, a) => s + a.extraOz, 0) +
    plannedActivities.filter((a) => a.finished).reduce((s, a) => s + a.extraOz, 0);
  const totalOz = (baseline?.waterOz ?? 0) + activityOz;
  const bottles = Math.ceil(totalOz / BOTTLE_OZ);

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

  const handleFinish = (id: string, intensity: "light" | "moderate" | "hard", extraOz: number) => {
    setPlannedActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, finished: true, intensity, extraOz } : a))
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
          <p className="text-sm text-gray-600 font-medium">How long will you be outside today?</p>
          <p className="text-xs text-gray-400 -mt-2">General errands, walking, shopping, etc.</p>
          <div className="grid grid-cols-3 gap-2">
            {OUTDOOR_OPTIONS.map((o) => (
              <button
                key={o.label}
                onClick={() => fetchBaseline(o.hours)}
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
      {showAdd && (
        <AddActivityModal weather={weather} onAdd={(a) => setLoggedActivities((p) => [...p, a])} onClose={() => setShowAdd(false)} />
      )}
      {showPlan && (
        <PlanActivityModal
          weather={weather}
          onPlan={(a) => setPlannedActivities((p) => [...p, a].sort((x, y) => x.startTime.localeCompare(y.startTime)))}
          onClose={() => setShowPlan(false)}
        />
      )}
      {finishTarget && (
        <FinishActivityModal activity={finishTarget} weather={weather} onFinish={handleFinish} onClose={() => setFinishTarget(null)} />
      )}

      {/* Greeting */}
      <div className="text-center">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{getGreeting()}, {preferredName}</p>
      </div>

      {/* Progress ring */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-3">
        <ProgressRing logged={intake} goal={totalOz} />

        {/* Bottle equivalent */}
        <p className="text-sm text-gray-500">
          ≈ <span className="font-semibold text-gray-700">{bottles}</span> plastic water bottles
          <span className="text-gray-400 text-xs ml-1">(16.9 oz each)</span>
        </p>

        {/* Log intake */}
        <div className="w-full pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-600 mb-2">💧 Log What You Drank</p>
          <p className="text-xs text-gray-400 mb-3">{intake} oz logged today · {Math.max(0, totalOz - intake)} oz remaining</p>
          <div className="flex gap-2 flex-wrap">
            {LOG_AMOUNTS.map((oz) => (
              <button
                key={oz}
                onClick={() => setIntake((p) => p + oz)}
                className="px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
              >
                +{oz} oz
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">Today&apos;s target</p>
        <div className="text-4xl font-black text-blue-600">{totalOz} <span className="text-2xl font-semibold">oz</span></div>
        <p className="text-xs text-gray-400">Estimate based on humidity, temp, and your details</p>
        {activityOz > 0 && (
          <p className="text-xs text-blue-500">+{activityOz} oz from activities</p>
        )}
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

      {/* Completed activities */}
      {(loggedActivities.length > 0 || finishedPlanned.length > 0) && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-sm font-semibold text-gray-600">Completed Activities</p>
          {loggedActivities.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{a.emoji} {a.sport} · {a.durationMin}m · {a.intensity}</span>
              <span className="text-blue-600 font-semibold">+{a.extraOz} oz</span>
            </div>
          ))}
          {finishedPlanned.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{a.emoji} {a.sport} · {a.startTime}–{a.endTime} · {a.intensity}</span>
              <span className="text-blue-600 font-semibold">+{a.extraOz} oz</span>
            </div>
          ))}
        </div>
      )}

      {/* Daily plan */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-600">Today&apos;s Schedule</p>

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

        <div className="space-y-1.5">
          {baseline.hourlySchedule.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 w-20 shrink-0">{s.time}</span>
              <div className="flex-1 bg-blue-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (s.oz / 16) * 100)}%` }} />
              </div>
              <span className="text-blue-600 font-medium w-10 text-right">{s.oz} oz</span>
            </div>
          ))}
        </div>

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
