"use client";
import { useState, useEffect, useRef } from "react";
import { UserProfile, Weather, HydrationResult, PlannedActivity, LoggedActivity } from "@/lib/types";
import { recordGoalHit, loadCurrentStreak, loadBottleSize, saveBottleSize } from "@/lib/storage";
import AddActivityModal from "./AddActivityModal";
import PlanActivityModal from "./PlanActivityModal";
import FinishActivityModal from "./FinishActivityModal";
import GoalReachedOverlay from "./GoalReachedOverlay";
import SharePlanCard from "./SharePlanCard";
import PreEventPlanner from "./PreEventPlanner";

type SectionId = "share" | "bottle" | "electrolytes" | "event";

// Same stone texture the home screen / app shell uses, so panels blend in.
const STONE_BG: React.CSSProperties = {
  backgroundColor: "#f0ede8",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
};

const MENU_ITEMS: { id: SectionId; emoji: string; label: string; desc: string }[] = [
  { id: "share",        emoji: "📤", label: "Share Progress",     desc: "Share today's hydration snapshot" },
  { id: "bottle",       emoji: "🍶", label: "Water Bottle Size",  desc: "Set your bottle so counts stay accurate" },
  { id: "electrolytes", emoji: "⚡", label: "Electrolytes",       desc: "Daily targets & product guide" },
  { id: "event",        emoji: "🏁", label: "Pre-Event Planner",  desc: "Race, game, or hike ramp-up plan" },
];

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [teamJoined, setTeamJoined] = useState(false);
  const codeBRef = useRef<HTMLInputElement>(null);

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
        cache: "no-store",
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

      {/* Join Team modal */}
      {showJoinTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            {teamJoined ? (
              <>
                <div className="text-center space-y-2 py-4">
                  <div className="text-5xl">🎉</div>
                  <p className="text-xl font-bold text-gray-800">You&apos;re on the team!</p>
                  <p className="text-sm text-gray-400">Your coach can now track your hydration progress.</p>
                </div>
                <button
                  onClick={() => setShowJoinTeam(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-800">Join a Team</h3>
                  <p className="text-sm text-gray-400">Enter the 6-digit code your coach shared with you.</p>
                </div>

                {/* Code input — two 3-digit halves with a dash */}
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={codeA}
                    placeholder="ABC"
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setCodeA(val);
                      if (val.length === 3) codeBRef.current?.focus();
                    }}
                    className="w-24 h-14 text-center text-2xl font-bold tracking-widest border-2 border-gray-200 focus:border-blue-500 rounded-2xl outline-none transition-colors"
                  />
                  <span className="text-3xl font-bold text-gray-300">–</span>
                  <input
                    ref={codeBRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={codeB}
                    placeholder="XYZ"
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setCodeB(val);
                    }}
                    className="w-24 h-14 text-center text-2xl font-bold tracking-widest border-2 border-gray-200 focus:border-blue-500 rounded-2xl outline-none transition-colors"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowJoinTeam(false)}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={codeA.length < 3 || codeB.length < 3}
                    onClick={() => setTeamJoined(true)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white font-semibold rounded-2xl transition-colors"
                  >
                    Join Team
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Greeting + streak counter */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded-xl hover:bg-white/70 transition-colors"
        >
          <span className="block w-5 h-0.5 bg-gray-500 rounded-full" />
          <span className="block w-5 h-0.5 bg-gray-500 rounded-full" />
          <span className="block w-5 h-0.5 bg-gray-500 rounded-full" />
        </button>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">{getGreeting()}, {preferredName}</p>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 text-orange-500 font-bold text-sm px-3 py-1.5 rounded-full shadow-sm">
              🔥 {streak}
            </div>
          )}
          <button
            onClick={() => { setShowJoinTeam(true); setTeamJoined(false); setCodeA(""); setCodeB(""); }}
            aria-label="Join a team"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 hover:bg-white shadow-sm text-blue-600 font-bold text-xl transition-colors"
          >
            +
          </button>
        </div>
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
        {(() => {
          const remaining = Math.max(0, totalOz - intake);
          const bottlesLeft = bottleOz > 0 ? Math.round((remaining / bottleOz) * 2) / 2 : 0;
          const done = bottlesLeft === 0 && intake >= totalOz;
          return (
            <p className="text-sm text-gray-500">
              {done ? (
                <span className="font-semibold text-green-600">Goal complete!</span>
              ) : (
                <>
                  <span className="font-semibold text-gray-700">{bottlesLeft}</span> water bottle{bottlesLeft !== 1 ? "s" : ""} left
                </>
              )}
              <span className="text-gray-400 text-xs ml-1">({bottleOz} oz each)</span>
            </p>
          );
        })()}
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

      {/* Hint to open menu */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2 px-4 rounded-full hover:bg-white/60"
        >
          <span className="flex flex-col gap-[3px]">
            <span className="block w-3.5 h-px bg-current rounded-full" />
            <span className="block w-3.5 h-px bg-current rounded-full" />
            <span className="block w-3.5 h-px bg-current rounded-full" />
          </span>
          More features
        </button>
      </div>

      {/* ── Hamburger menu overlay ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          {/* Drawer — slides in from the left to match the hamburger position */}
          <div className="relative mr-auto w-[85%] max-w-sm h-full bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-8 pb-5 border-b border-gray-100">
              <div>
                <p className="text-xl font-black text-blue-600">Aqua</p>
                <p className="text-xs text-gray-400">More features</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-lg"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveSection(item.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 transition-colors text-left group"
                >
                  <span className="text-3xl w-12 h-12 flex items-center justify-center bg-gray-100 group-hover:bg-blue-100 rounded-xl transition-colors">
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.desc}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-blue-400 transition-colors">›</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ── Section panels — constrained to the same width as the home screen ── */}
      {activeSection && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop fills the area outside the panel */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setActiveSection(null)} />
          {/* Panel card — matches home-screen column width + stone background */}
          <div className="relative max-w-lg mx-auto min-h-full shadow-xl flex flex-col" style={STONE_BG}>
          {/* Panel header */}
          <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-black/5 sticky top-0 z-10" style={STONE_BG}>
            <button
              onClick={() => setActiveSection(null)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 text-lg"
            >
              ←
            </button>
            <div>
              <p className="font-bold text-gray-800 text-base leading-tight">
                {MENU_ITEMS.find((m) => m.id === activeSection)?.label}
              </p>
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 p-5 space-y-5">
            {activeSection === "share" && (
              <SharePlanCard
                preferredName={preferredName}
                drankOz={intake}
                goalOz={totalOz}
                bottleOz={bottleOz}
                weather={weather}
                sodiumMg={baseline.sodiumMg}
                streak={streak}
              />
            )}

            {activeSection === "bottle" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Set your bottle size so the bottle count on the home screen matches what you actually drink from.
                </p>
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-gray-400">Current: {bottleOz} oz per bottle</p>
              </div>
            )}

            {activeSection === "electrolytes" && (
              <div className="space-y-3">
                <Accordion title="Your Daily Targets">
                  <p className="text-xs text-gray-400 mb-2">Based on today&apos;s sweat losses.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Sodium",    value: baseline.sodiumMg,    color: "text-orange-500", bg: "bg-orange-50" },
                      { label: "Potassium", value: baseline.potassiumMg, color: "text-green-600",  bg: "bg-green-50" },
                      { label: "Magnesium", value: baseline.magnesiumMg, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((e) => (
                      <div key={e.label} className={`${e.bg} rounded-xl p-3 text-center`}>
                        <div className={`text-lg font-bold ${e.color}`}>{e.value}<span className="text-xs font-medium ml-0.5">mg</span></div>
                        <div className="text-xs text-gray-400">{e.label}</div>
                      </div>
                    ))}
                  </div>
                </Accordion>
                <Accordion title="Electrolyte Mixes">
                  {ELECTROLYTE_MIXES.map((m) => <ElectrolyteRow key={m.name} item={m} />)}
                </Accordion>
                <Accordion title="Electrolyte Drinks">
                  {ELECTROLYTE_DRINKS.map((d) => <ElectrolyteRow key={d.name} item={d} />)}
                </Accordion>
              </div>
            )}

            {activeSection === "event" && (
              <PreEventPlanner profile={profile} weather={weather} />
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
