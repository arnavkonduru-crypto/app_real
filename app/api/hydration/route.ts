import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { UserProfile, Activity, Weather } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { profile, activities, weather } = (await req.json()) as {
    profile: UserProfile;
    activities: Activity[];
    weather: Weather;
  };

  const activitiesText =
    activities.length === 0
      ? "No planned exercise — mostly sedentary day."
      : activities
          .map((a) => `${a.name} for ${a.durationMin} minutes at ${a.intensity} intensity`)
          .join(", ");

  const prompt = `You are a sports medicine and nutrition expert. Calculate a precise daily hydration plan.

USER PROFILE:
- Age: ${profile.age}
- Weight: ${profile.weightLbs} lbs (${(profile.weightLbs * 0.453592).toFixed(1)} kg)
- Height: ${Math.floor(profile.heightIn / 12)}ft ${profile.heightIn % 12}in
- Sex: ${profile.sex}

TODAY'S WEATHER:
- Temperature: ${weather.tempF}°F (${(((weather.tempF - 32) * 5) / 9).toFixed(1)}°C)
- Humidity: ${weather.humidity}%
- UV Index: ${weather.uvIndex} (${weather.description})

TODAY'S ACTIVITIES:
${activitiesText}

Respond with ONLY valid JSON matching this exact structure (no markdown, no explanation outside JSON):
{
  "waterOz": <number>,
  "waterMl": <number>,
  "sodiumMg": <number>,
  "potassiumMg": <number>,
  "magnesiumMg": <number>,
  "hourlySchedule": [
    { "time": "7:00 AM", "oz": <number>, "note": "<short note>" },
    ...8-10 entries across the day...
  ],
  "drinkSuggestions": [
    "<suggestion 1>",
    "<suggestion 2>",
    "<suggestion 3>"
  ],
  "reasoning": "<2-3 sentence explanation of why these numbers, factoring in the weather and activities>"
}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 });
  }
}
