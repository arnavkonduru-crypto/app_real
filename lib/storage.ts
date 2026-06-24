import { UserProfile } from "./types";

export function saveProfile(profile: UserProfile) {
  localStorage.setItem("hydration_profile", JSON.stringify(profile));
}

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem("hydration_profile");
  return raw ? JSON.parse(raw) : null;
}

export function saveStreak() {
  const today = new Date().toDateString();
  const data = loadStreakData();
  if (data.lastDate === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const count =
    data.lastDate === yesterday.toDateString() ? data.count + 1 : 1;
  localStorage.setItem(
    "hydration_streak",
    JSON.stringify({ lastDate: today, count })
  );
}

export function loadStreakData(): { lastDate: string; count: number } {
  const raw = localStorage.getItem("hydration_streak");
  return raw ? JSON.parse(raw) : { lastDate: "", count: 0 };
}

// Records that the user hit their goal today and bumps the consecutive-day streak.
// Returns the new streak count. No-op (returns current count) if already recorded today.
export function recordGoalHit(): number {
  const today = new Date().toDateString();
  const data = loadStreakData();
  if (data.lastDate === today) return data.count;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const count = data.lastDate === yesterday.toDateString() ? data.count + 1 : 1;
  localStorage.setItem("hydration_streak", JSON.stringify({ lastDate: today, count }));
  return count;
}

// Returns the streak count, resetting to 0 if the last goal-hit was before yesterday.
export function loadCurrentStreak(): number {
  const data = loadStreakData();
  if (!data.lastDate) return 0;
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (data.lastDate === today || data.lastDate === yesterday.toDateString()) return data.count;
  return 0;
}

const BOTTLE_KEY = "hydration_bottle_oz";

export function saveBottleSize(oz: number) {
  localStorage.setItem(BOTTLE_KEY, JSON.stringify(oz));
}

export function loadBottleSize(): number {
  const raw = localStorage.getItem(BOTTLE_KEY);
  return raw ? JSON.parse(raw) : 16.9;
}

export function saveIntakeLog(oz: number) {
  const today = new Date().toDateString();
  const raw = localStorage.getItem(`hydration_log_${today}`);
  const current = raw ? JSON.parse(raw) : 0;
  localStorage.setItem(`hydration_log_${today}`, JSON.stringify(current + oz));
}

export function loadIntakeLog(): number {
  const today = new Date().toDateString();
  const raw = localStorage.getItem(`hydration_log_${today}`);
  return raw ? JSON.parse(raw) : 0;
}
