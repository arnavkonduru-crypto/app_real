import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const dynamic = "force-dynamic";

export interface CitySuggestion {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
  display: string;
}

export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query: string };
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Claude normalises whatever the user typed into a clean geocodable city name.
  // This handles abbreviations, nicknames, "City, State" formats, etc.
  let cleanName = query.trim();
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 30,
      messages: [
        {
          role: "user",
          content: `You are a geocoding helper. Convert the user's city input into the cleanest English city name for a geocoding API search. Return ONLY the city name — no state, no country, no punctuation, nothing else. Examples: "Austin, TX" → Austin | "NYC" → New York City | "LA" → Los Angeles | "windy city" → Chicago | "san fran" → San Francisco | "philly" → Philadelphia. Input: "${query.trim()}"`,
        },
      ],
    });
    if (msg.content[0].type === "text") {
      cleanName = msg.content[0].text.trim().replace(/[^a-zA-Z\s\-']/g, "").trim();
    }
  } catch {
    // Fall back: strip everything after a comma (e.g. "Austin, TX" → "Austin")
    cleanName = query.split(",")[0].trim();
  }

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanName)}&count=6&language=en`
    );
    const geoData = await geoRes.json();
    const results: CitySuggestion[] = (geoData.results ?? []).map(
      (r: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }) => {
        const parts = [r.name, r.admin1, r.country].filter(Boolean);
        return {
          name: r.name,
          admin1: r.admin1 ?? "",
          country: r.country ?? "",
          latitude: r.latitude,
          longitude: r.longitude,
          display: parts.join(", "),
        };
      }
    );
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
