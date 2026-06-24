"use client";
import { useState, useEffect, useRef } from "react";
import { UserProfile, Weather, HydrationResult, PlannedActivity, LoggedActivity } from "@/lib/types";
import { recordGoalHit, loadCurrentStreak, loadBottleSize, saveBottleSize } from "@/lib/storage";
import AddActivityModal from "./AddActivityModal";
import PlanActivityModal from "./PlanActivityModal";
import FinishActivityModal from "./FinishActivityModal";
import GoalReachedOverlay from "./GoalReachedOverlay";
import SharePlanCard from "./SharePlanCard";

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

const ELECTROLYTE_MIXES = [
  { name: "LMNT", sodium: 1000, potassium: 200, magnesium: 60, calcium: 0, sugar: "0g", note: "High sodium, keto-friendly" },
  { name: "Liquid I.V.", sodium: 500, potassium: 380, magnesium: 0, calcium: 0, sugar: "11g", note: "3× faster absorption" },
  { name: "Nuun Sport", sodium: 300, potassium: 150, magnesium: 25, calcium: 13, sugar: "1g", note: "Low calorie, tablet form" },
  { name: "DripDrop ORS", sodium: 330, potassium: 185, magnesium: 32, calcium: 0, sugar: "7g", note: "Medical-grade ORS formula" },
  { name: "Pedialyte Powder", sodium: 370, potassium: 280, magnesium: 0, calcium: 0, sugar: "9g", note: "Great for heavy sweaters" },
];

const ELECTROLYTE_DRINKS = [
  { name: "Gatorade (20 oz)", sodium: 270, potassium: 75, magnesium: 0, calcium: 0, sugar: "34g", note: "Classic sports drink" },
  { name: "Powerade (20 oz)", sodium: 250, potassium: 75, magnesium: 0, calcium: 0, sugar: "34g", note: "B vitamins added" },
  { name: "BodyArmor (16 oz)", sodium: 20, potassium: 700, magnesium: 30, calcium: 0, sugar: "21g", note: "High potassium, coconut water base" },
  { name: "Coconut Water (16 oz)", sodium: 160, potassium: 600, magnesium: 60, calcium: 40, sugar: "15g", note: "Natural, unprocessed" },
  { name: "Pedialyte (12 oz)", sodium: 370, potassium: 280, magnesium: 0, calcium: 0, sugar: "9g", note: "Optimal rehydration ratio" },
  { name: "Vita Coco (11 oz)", sodium: 55, potassium: 470, magnesium: 25, calcium: 45, sugar: "12g", note: "Light, natural electrolytes" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function to24Minutes(time12: string): number {
  const [time, ampm] = time12.trim().split(" ");
  let [h, m] = time.split(":").map(Number);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function scheduleTo24Minutes(time: string): number {
  if (time.includes("AM") || time.includes("PM")) return to24Minutes(time);
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function subMinutes(time12: string, mins: number): string {
  let total = to24Minutes(time12) - mins;
  if (total < 0) total = 0;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addMinutes(time12: string, mins: number): string {
  const total = to24Minutes(time12) + mins;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

type ScheduleItem =
  | { kind: "hydration"; time: string; oz: number; note: string; minutes: number }
  | { kind: "activity-pre"; time: string; activity: PlannedActivity; minutes: number }
  | { kind: "activity"; time: string; activity: PlannedActivity; minutes: number }
  | { kind: "activity-post"; time: string; activity: PlannedActivity; minutes: number };

function buildSchedule(baseline: HydrationResult, planned: PlannedActivity[]): ScheduleItem[] {
  const items: ScheduleItem[] = baseline.hourlySchedule.map((s) => ({
    kind: "hydration", time: s.time, oz: s.oz, note: s.note, minutes: scheduleTo24Minutes(s.time),
  }));
  for (const act of planned) {
    const startMin = to24Minutes(act.startTime);
    const endMin = to24Minutes(act.endTime);
    items.push({ kind: "activity-pre", time: subMinutes(act.startTime, 30), activity: act, minutes: startMin - 30 });
    items.push({ kind: "activity", time: act.startTime, activity: act, minutes: startMin });
    items.push({ kind: "activity-post", time: addMinutes(act.endTime, 15), activity: act, minutes: endMin + 15 });
  }
  return items.sort((a, b) => a.minutes - b.minutes);
}

function ProgressRing({ logged, goal }: { logged: number; goal: number }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = goal > 0 ? Math.min(1, logged / goal) * circ : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#dbeafe" strokeWidth="14" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="#3b82f6" strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 100 100)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
        <text x="100" y="90" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#3b82f6">{logged}</text>
        <text x="100" y="112" textAnchor="middle" fontSize="14" fill="#6b7280">oz</text>
        <text x="100" y="132" textAnchor="middle" fontSize="12" fill="#9ca3af">of {goal} oz goal</text>
      </svg>
      <p className="text-xs text-gray-400">{goal} oz · {Math.round(goal * 29.5735)} ml total goal</p>
    </div>
  );
}

function ElectrolyteRow({ item }: { item: typeof ELECTROLYTE_MIXES[number] }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">{item.name}</span>
        <span className="text-xs text-gray-400">{item.note}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">Na {item.sodium}mg</span>
        <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">K {item.potassium}mg</span>
        {item.magnesium > 0 && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Mg {item.magnesium}mg</span>}
        {item.calcium > 0 && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Ca {item.calcium}mg</span>}
        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Sugar {item.sugar}</span>
      </div>
    </div>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
        {title}
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-2">{children}</div>}
    </div>
  );
}

export default function HomeScreen({ profile, weather, preferredName }: Props) {
  const [phase, setPhase] = useState<"outdoor" | "loading" | "dashboard">("outdoor");
  const [baseline, setBaseline] = useState<HydrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [intake, setIntake] = useState(0);
  const [showRemove, setShowRemove] = useState(false);
  const [loggedActivities, setLoggedActivities] = useState<LoggedActivity[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<PlannedActivity[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [finishTarget, setFinishTarget] = useState<PlannedActivity | null>(null);

  const [streak, setStreak] = useState(0);
  const [showGoalReached, setShowGoalReached] = useState(false);
  const celebratedRef = useRef(false);

  const [bottleOz, setBottleOz] = useState(BOTTLE_OZ);
  const [bottleInput, setBottleInput] = useState("");

  // Load saved streak + bottle size on mount (client only).
  useEffect(() => {
    setStreak(loadCurrentStreak());
    const saved = loadBottleSize();
    setBottleOz(saved);
    setBottleInput(String(saved));
  }, []);

  const activityOz =
    loggedActivities.reduce((s, a) => s + a.extraOz, 0) +
    plannedActivities.filter((a) => a.finished).reduce((s, a) => s + a.extraOz, 0);
  const totalOz = (baseline?.waterOz ?? 0) + activityOz;
  const bottles = bottleOz > 0 ? Math.ceil(totalOz / bottleOz) : 0;

  // Fire the goal-reached celebration once when logged intake meets the target.
  useEffect(() => {
    if (totalOz > 0 && intake >= totalOz && !celebratedRef.current) {
      celebratedRef.current = true;
      const newStreak = recordGoalHit();
      setStreak(newStreak);
      setShowGoalReached(true);
    }
  }, [intake, totalOz]);

  const applyBottleSize = () => {
    const val = parseFloat(bottleInput);
    if (!isNaN(val) && val > 0) {
      setBottleOz(val);
      saveBottleSize(val);
    } else {
      setBottleInput(String(bottleOz));
    }
  };

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
    setPlannedActivities((prev) => prev.map((a) => (a.id === id ? { ...a, finished: true, intensity, extraOz } : a)));
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
              <button key={o.label} onClick={() => fetchBaseline(o.hours)}
                className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors">
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
  const schedule = buildSchedule(baseline, pendingPlanned);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {showAdd && (
        <AddActivityModal weather={weather} onAdd={(a) => setLoggedActivities((p) => [...p, a])} onClose={() => setShowAdd(false)} />
      )}
      {showPlan && (
        <PlanActivityModal weather={weather} onPlan={(a) => setPlannedActivities((p) => [...p, a])} onClose={() => setShowPlan(false)} />
      )}
      {finishTarget && (
        <FinishActivityModal activity={finishTarget} weather={weather} onFinish={handleFinish} onClose={() => setFinishTarget(null)} />
      )}
      {showGoalReached && (
        <GoalReachedOverlay streak={streak} onClose={() => setShowGoalReached(false)} />
      )}

      {/* Greeting + streak counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{getGreeting()}, {preferredName}</p>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-500 font-bold text-sm px-3 py-1.5 rounded-full shadow-sm">
            🔥 {streak} day{streak !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Today's target */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-2">Today&apos;s target</p>
        <div className="text-4xl font-black text-blue-600">{totalOz} <span className="text-2xl font-semibold">oz</span></div>
        <p className="text-xs text-gray-400">Estimate based on humidity, temp, and your details</p>
        {activityOz > 0 && <p className="text-xs text-blue-500">+{activityOz} oz from activities</p>}
      </div>

      {/* Progress ring + log */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-3">
        <ProgressRing logged={intake} goal={totalOz} />
        <p className="text-sm text-gray-500">
          ≈ <span className="font-semibold text-gray-700">{bottles}</span> water bottles
          <span className="text-gray-400 text-xs ml-1">({bottleOz} oz each)</span>
        </p>
        <div className="w-full pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-600 mb-1">💧 Log What You Drank</p>
          <p className="text-xs text-gray-400 mb-3">{intake} oz logged · {Math.max(0, totalOz - intake)} oz remaining</p>
          <div className="flex gap-2 flex-wrap mb-2">
            {LOG_AMOUNTS.map((oz) => (
              <button key={oz} onClick={() => setIntake((p) => p + oz)}
                className="px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm font-semibold text-gray-700 transition-colors">
                +{oz} oz
              </button>
            ))}
          </div>
          <button onClick={() => setShowRemove((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            {showRemove ? "▲" : "▼"} Remove oz
          </button>
          {showRemove && (
            <div className="flex gap-2 flex-wrap mt-2">
              {LOG_AMOUNTS.map((oz) => (
                <button key={oz} onClick={() => setIntake((p) => Math.max(0, p - oz))}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-sm font-semibold transition-colors">
                  −{oz} oz
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowAdd(true)}
          className="bg-white border-2 border-blue-200 rounded-2xl p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors shadow-sm">
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-semibold text-gray-800 text-sm">Add Activity</div>
          <div className="text-xs text-gray-400 mt-0.5">Already did or doing now</div>
        </button>
        <button onClick={() => setShowPlan(true)}
          className="bg-white border-2 border-purple-200 rounded-2xl p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="font-semibold text-gray-800 text-sm">Plan Activity</div>
          <div className="text-xs text-gray-400 mt-0.5">Schedule for later today</div>
        </button>
      </div>

      {/* Pending planned activities — finish buttons */}
      {pendingPlanned.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-600">Upcoming Activities</p>
          {pendingPlanned.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border border-purple-100 bg-purple-50 rounded-xl px-3 py-2.5">
              <div>
                <span className="font-semibold text-purple-800 text-sm">{a.emoji} {a.sport}</span>
                <span className="text-xs text-purple-400 ml-2">{a.startTime} – {a.endTime}</span>
              </div>
              <button onClick={() => setFinishTarget(a)}
                className="shrink-0 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                I Finished
              </button>
            </div>
          ))}
        </div>
      )}

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

      {/* Merged daily schedule — vertical timeline */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-4">📋 Today&apos;s Schedule</p>
        <div className="relative pl-7">
          {/* timeline spine */}
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
          <div className="space-y-4">
            {schedule.map((item, i) => {
              if (item.kind === "hydration") {
                return (
                  <div key={i} className="relative">
                    <span className="absolute -left-[26px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{item.time}</p>
                        <p className="text-xs text-gray-400">{item.note}</p>
                      </div>
                      <span className="shrink-0 bg-blue-50 text-blue-600 text-sm font-bold px-3 py-1 rounded-full">{item.oz} oz</span>
                    </div>
                  </div>
                );
              }
              if (item.kind === "activity") {
                return (
                  <div key={i} className="relative">
                    <span className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-purple-100 flex items-center justify-center text-[8px]" />
                    <div className="border border-purple-200 bg-purple-50 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-800 text-sm">{item.activity.emoji} {item.activity.sport}</span>
                        <span className="text-xs text-purple-400">{item.activity.startTime} – {item.activity.endTime}</span>
                      </div>
                      <p className="text-xs text-purple-500 mt-1">💧 Sip 4–6 oz every 15–20 min during</p>
                    </div>
                  </div>
                );
              }
              const label =
                item.kind === "activity-pre"
                  ? `Pre-${item.activity.sport} — drink 8 oz`
                  : `Post-${item.activity.sport} — drink 8–12 oz`;
              return (
                <div key={i} className="relative">
                  <span className="absolute -left-[24px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-300 ring-4 ring-purple-50" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-purple-600">{item.time}</p>
                    <span className="text-xs text-purple-500">💧 {label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Share plan card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Share Your Progress</p>
        <SharePlanCard
          preferredName={preferredName}
          drankOz={intake}
          goalOz={totalOz}
          bottleOz={bottleOz}
          weather={weather}
          sodiumMg={baseline.sodiumMg}
          streak={streak}
        />
      </div>

      {/* Custom bottle size */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-1">Your Water Bottle</p>
        <p className="text-xs text-gray-400 mb-3">Set your bottle size so the bottle count matches what you actually drink from.</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={bottleInput}
            onChange={(e) => setBottleInput(e.target.value)}
            onBlur={applyBottleSize}
            onKeyDown={(e) => e.key === "Enter" && applyBottleSize()}
            className="input flex-1"
            placeholder="16.9"
          />
          <span className="text-sm text-gray-500 font-medium">oz</span>
          <button
            onClick={applyBottleSize}
            className="px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Electrolytes — target amounts + product options */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-700">Electrolytes</p>
        <p className="text-xs text-gray-400 -mt-1">Your daily targets based on today&apos;s sweat losses.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sodium", value: baseline.sodiumMg, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Potassium", value: baseline.potassiumMg, color: "text-green-600", bg: "bg-green-50" },
            { label: "Magnesium", value: baseline.magnesiumMg, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((e) => (
            <div key={e.label} className={`${e.bg} rounded-xl p-3 text-center`}>
              <div className={`text-lg font-bold ${e.color}`}>{e.value}<span className="text-xs font-medium ml-0.5">mg</span></div>
              <div className="text-xs text-gray-400">{e.label}</div>
            </div>
          ))}
        </div>
        <Accordion title="Electrolyte Mixes">
          {ELECTROLYTE_MIXES.map((m) => <ElectrolyteRow key={m.name} item={m} />)}
        </Accordion>
        <Accordion title="Electrolyte Drinks">
          {ELECTROLYTE_DRINKS.map((d) => <ElectrolyteRow key={d.name} item={d} />)}
        </Accordion>
      </div>
    </div>
  );
}
