import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { UserProfile, Activity, Weather } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { profile, weather, outdoorHours, activities } = (await req.json()) as {
    profile: UserProfile;
    weather: Weather;
    outdoorHours: number;
    activities?: Activity[];
  };

  const activitiesText =
    !activities || activities.length === 0
      ? "No planned exercise."
      : activities.map((a) => `${a.name} for ${a.durationMin} min at ${a.intensity} intensity`).join(", ");

  const prompt = `You are a sports medicine and nutrition expert. Calculate a precise daily hydration plan.

BASELINE METHODOLOGY (evidence-based — follow exactly):
- The "waterOz" target represents ONLY plain water/beverages the user should actively DRINK. It must NOT include water obtained from food.
- Start from total fluid Adequate Intake (U.S. National Academies of Medicine): ~125 oz/day total water for men, ~91 oz/day for women, for an average-sized sedentary adult in a temperate climate.
- About 20% of total water comes from food, so subtract that: the beverage target is ~100 oz (men) / ~73 oz (women) before personalization.
- Scale this by body weight relative to an average adult (men ~195 lb, women ~170 lb in the AI reference data), but keep the scaling gentle — do not let small people get extreme low values or large people extreme highs.
- Sanity anchor: the result should land near "half the user's body weight in ounces" for a mild-weather day, and typically between 50 and 90 oz. Only exceed 90 oz for genuinely hot (85°F+), humid, or high-outdoor-exposure days.
- Do NOT add water for planned exercise here — exercise is tracked separately. Be conservative; when uncertain, round down.

USER PROFILE:
- Age: ${profile.age}
- Weight: ${profile.weightLbs} lbs
- Height: ${Math.floor(profile.heightIn / 12)}ft ${profile.heightIn % 12}in
- Sex: ${profile.sex}

TODAY'S WEATHER:
- Temperature: ${weather.tempF}°F
- Humidity: ${weather.humidity}%
- UV Index: ${weather.uvIndex} (${weather.description})

OUTDOOR EXPOSURE TODAY: ${outdoorHours} hour(s) of general outdoor time (walking, errands, etc.)

PLANNED EXERCISE: ${activitiesText}

Respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "waterOz": <number>,
  "waterMl": <number>,
  "sodiumMg": <number>,
  "potassiumMg": <number>,
  "magnesiumMg": <number>,
  "hourlySchedule": [
    { "time": "7:00 AM", "oz": <number>, "note": "<short note>" }
  ],
  "drinkSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "reasoning": "<2-3 sentences explaining the numbers based on weather, outdoor time, and activities>"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON in AI response", raw: text }, { status: 500 });
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
