import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { UserProfile, Weather } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { profile, weather, eventName, eventType, daysUntil, eventTime } = (await req.json()) as {
    profile: UserProfile;
    weather: Weather;
    eventName: string;
    eventType: string;
    daysUntil: number;
    eventTime: string;
  };

  const prompt = `You are a sports medicine and hydration expert. Build a multi-day hydration RAMP-UP plan leading into an athletic event.

USER PROFILE:
- Age: ${profile.age}
- Weight: ${profile.weightLbs} lbs
- Sex: ${profile.sex}

EVENT:
- Name: ${eventName || eventType}
- Type: ${eventType}
- Starts in: ${daysUntil} day(s), at ${eventTime}
- Expected conditions (current local weather as proxy): ${weather.tempF}°F, ${weather.humidity}% humidity, UV ${weather.uvIndex}

Build a day-by-day plan covering the days leading up to and including event day. Pre-hydration should ramp up gradually (don't overload — steady consistent intake beats last-minute chugging). On event day include specific pre-event, during, and post-event guidance with timing relative to ${eventTime}.

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "days": [
    { "label": "<e.g. '2 days before · Fri'>", "targetOz": <number>, "sodiumMg": <number>, "tips": ["<short tip>", "<short tip>"] }
  ],
  "eventDay": [
    { "time": "<e.g. '2 hrs before'>", "action": "<what to drink/do>" }
  ],
  "summary": "<1-2 sentence overview of the strategy>"
}

Keep daily targets realistic and conservative (drinking water, not total fluids). The number of entries in "days" should match the ramp-up window (cap at 4 days even if the event is further out).`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON in AI response", raw: text }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
