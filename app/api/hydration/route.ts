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

IMPORTANT BASELINE GUIDANCE: Be conservative with the baseline water target. For a sedentary day in mild weather, a healthy adult needs only about 0.3–0.4 oz per lb of body weight from DRINKING water (food provides additional fluid on top of this, so the drinking target is lower than total needs). Do NOT over-recommend. Only increase modestly above this for genuinely hot weather, high humidity, or significant outdoor exposure. Do not add water for planned exercise here — that is tracked separately. A typical baseline for an average adult should land around 55–70 oz, and should not exceed 85 oz unless conditions are truly extreme.

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
