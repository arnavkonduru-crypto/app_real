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
