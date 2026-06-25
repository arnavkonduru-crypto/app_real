import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { UserProfile, Activity, Weather } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Never cache — every profile/condition combination must hit the model fresh.
export const dynamic = "force-dynamic";

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

  // Weather only matters in proportion to how long the user is actually outside.
  const weatherSection =
    outdoorHours > 0
      ? `OUTDOOR EXPOSURE: The user will spend about ${outdoorHours} hour(s) outdoors today.
TODAY'S WEATHER (apply ONLY because of the outdoor exposure above — scale the adjustment by how many hours outside and how extreme conditions are):
- Temperature: ${weather.tempF}°F
- Humidity: ${weather.humidity}%
- UV Index: ${weather.uvIndex} (${weather.description})`
      : `OUTDOOR EXPOSURE: The user will be indoors essentially all day (0 hours outside). DO NOT apply any weather-based adjustment — weather is irrelevant when the user stays indoors in climate control.`;

  const prompt = `You are a sports medicine and nutrition expert. Produce a personalized daily DRINKING-water target for one specific person. Think carefully and let EVERY input below change the number — two different people must get different numbers.

HOW TO REASON ABOUT THE BASELINE (the water they should drink, excluding water from food):
- Anchor on the U.S. National Academies of Medicine Adequate Intake: ~125 oz/day TOTAL water for an average man, ~91 oz/day for an average woman. ~20% of that comes from food, so the amount to actually DRINK is roughly ~100 oz (men) / ~73 oz (women) for an average adult.
- Then PERSONALIZE genuinely, adjusting up or down from that anchor based on ALL of:
  - Body weight (heavier = more; this is the biggest factor) and height/build.
  - Sex (men generally need more than women).
  - Age (older adults often need slightly less per lb; teens/young adults slightly more).
- These are guidelines, not a rigid formula. Use your judgment so the number genuinely reflects THIS person. Do not just output half their body weight.
- Keep it sensible: for most adults the indoor baseline lands roughly between 45 and 95 oz.
- Do NOT add water for planned exercise — that is tracked separately by the app.

${weatherSection}

PLANNED EXERCISE (for context only — do NOT add its water here): ${activitiesText}

THIS PERSON:
- Age: ${profile.age}
- Weight: ${profile.weightLbs} lbs
- Height: ${Math.floor(profile.heightIn / 12)}ft ${profile.heightIn % 12}in
- Sex: ${profile.sex}

Respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "waterOz": <number, the personalized drinking-water target>,
  "waterMl": <number>,
  "sodiumMg": <number>,
  "potassiumMg": <number>,
  "magnesiumMg": <number>,
  "hourlySchedule": [
    { "time": "7:00 AM", "oz": <number>, "note": "<short note>" }
  ],
  "drinkSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "reasoning": "<2-3 sentences explaining how this person's weight, sex, age, and (if outside) the weather shaped the number>"
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
