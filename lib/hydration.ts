import { Weather } from "./types";

// Approximate sweat-rate factor per activity, relative to a moderate baseline.
// Higher = sweatier = more fluid replacement needed per minute.
export const SPORT_FACTORS: Record<string, number> = {
  running: 1.4,
  cycling: 1.1,
  gym: 0.85,
  hiking: 1.0,
  yoga: 0.55,
  swimming: 0.7,
  sports: 1.25,
  walking: 0.45,
  desk: 0.2,
  outdoor: 0.8,
};

const BASE_OZ_PER_HOUR = 14; // moderate-intensity baseline replacement rate

const INTENSITY_FACTOR = { light: 0.7, moderate: 1.0, hard: 1.45 } as const;

// Weather multiplier — hotter, more humid, and higher UV all raise sweat loss.
function weatherFactor(weather: Weather): number {
  let f = 1;
  if (weather.tempF >= 95) f *= 1.4;
  else if (weather.tempF >= 85) f *= 1.25;
  else if (weather.tempF >= 75) f *= 1.1;
  if (weather.humidity >= 70) f *= 1.12;
  else if (weather.humidity >= 55) f *= 1.05;
  if (weather.uvIndex >= 8) f *= 1.05;
  return f;
}

// Extra oz of water to replace fluids lost during a specific activity,
// unique per sport and adjusted for the user's current local weather.
export function calcActivityOz(
  sportId: string,
  durationMin: number,
  intensity: "light" | "moderate" | "hard",
  weather: Weather
): number {
  const sport = SPORT_FACTORS[sportId] ?? 1.0;
  const oz =
    BASE_OZ_PER_HOUR *
    (durationMin / 60) *
    sport *
    INTENSITY_FACTOR[intensity] *
    weatherFactor(weather);
  return Math.round(oz);
}
