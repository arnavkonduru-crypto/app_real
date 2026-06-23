export interface UserProfile {
  age: number;
  weightLbs: number;
  heightIn: number;
  sex: "male" | "female";
}

export interface Activity {
  id: string;
  name: string;
  emoji: string;
  durationMin: number;
  intensity: "light" | "moderate" | "hard";
}

export interface Weather {
  tempF: number;
  humidity: number;
  uvIndex: number;
  description: string;
}

export interface HydrationResult {
  waterOz: number;
  waterMl: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  hourlySchedule: { time: string; oz: number; note: string }[];
  drinkSuggestions: string[];
  reasoning: string;
}
