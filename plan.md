# AI Hydration App — Plan

> **Reference this file every prompt.**

## What It Is
A personalized AI hydration advisor that factors in the user's body, the current weather, and planned activities to give a precise daily water + electrolyte target — not a generic "drink 8 cups" recommendation.

---

## Core Features (MVP)

### 1. User Profile
- Age, weight, height, biological sex
- Stored in localStorage (no login required for MVP)

### 2. Weather Integration
- Auto-detect location via browser geolocation
- Pull real-time weather from Open-Meteo API (free, no key needed)
- Factors: temperature, humidity, UV index

### 3. Activity Planner
- User picks activities for the day (running, gym, hiking, yoga, desk work, etc.)
- Duration + intensity level (light / moderate / hard)
- Multiple activities supported

### 4. AI Calculation Engine
- Calls Claude API (claude-haiku-4-5-20251001 for cost efficiency)
- Prompt includes: profile + weather + activities
- Returns:
  - Total water (oz + ml)
  - Sodium (mg)
  - Potassium (mg)
  - Magnesium (mg)
  - Timing recommendations (e.g. "drink 16oz before your run")

### 5. Results Dashboard
- Visual water meter / progress ring
- Electrolyte breakdown cards
- Drink-type suggestions (plain water, sports drink, electrolyte tablet, coconut water)
- Shareable summary card

---

## Suggested Additional Features

| Feature | Why |
|---|---|
| Hourly hydration schedule | Tells you *when* to drink, not just how much |
| Sweat rate estimator | Based on activity + heat index for athletes |
| Hydration streak tracker | Gamification to build the habit (localStorage) |
| Reminder copy | Generates push-notification-style reminders user can screenshot |
| "What I drank" logger | Track actual intake vs target, show gap |
| Dark mode | Standard UX expectation |

---

## Tech Stack
- **Framework:** Next.js 15 (App Router) — already scaffolded
- **Styling:** Tailwind CSS — already installed
- **AI:** Claude API via `@anthropic-ai/sdk`
- **Weather:** Open-Meteo (free, no API key)
- **State:** React useState + localStorage
- **No backend needed** — Claude API called from a Next.js API route

---

## File Structure
```
app/
  page.tsx                        ← Main orchestrator (step state machine)
  api/
    hydration/route.ts            ← Claude API call (server-side)

components/
  profile/
    ProfileForm.tsx               ← Step 1: age, weight, height, sex
  activities/
    ActivityPicker.tsx            ← Step 2: pick activities + duration + intensity
    ACTIVITIES.ts                 ← Master list of activity definitions
  weather/
    WeatherCard.tsx               ← Displays fetched weather conditions
  results/
    ResultsDashboard.tsx          ← Wrapper for all result panels
    WaterMeter.tsx                ← Animated progress ring
    ElectrolyteCards.tsx          ← Sodium / potassium / magnesium breakdown
    HourlySchedule.tsx            ← When to drink throughout the day
    DrinkSuggestions.tsx          ← Plain water vs sports drink vs coconut water
  logger/
    IntakeLogger.tsx              ← "What I drank" tracker
  streak/
    StreakTracker.tsx             ← Daily streak + habit gamification
  ui/
    Button.tsx                    ← Shared button
    Card.tsx                      ← Shared card wrapper
    StepIndicator.tsx             ← 1 → 2 → 3 → Results progress bar

lib/
  weather.ts                      ← Open-Meteo fetch logic
  storage.ts                      ← localStorage read/write helpers
  types.ts                        ← Shared TypeScript types

hooks/
  useProfile.ts                   ← Profile state + localStorage sync
  useWeather.ts                   ← Weather fetch hook
  useStreak.ts                    ← Streak logic hook
```

---

## Build Order
- [x] Plan created
- [x] Install `@anthropic-ai/sdk`
- [x] Build ProfileForm + ActivityPicker UI
- [x] Integrate Open-Meteo weather fetch
- [x] Build `/api/hydration` route with Claude prompt
- [x] Build ResultsDashboard with WaterMeter
- [x] Add hourly schedule feature
- [x] Add "what I drank" logger
- [ ] Add ANTHROPIC_API_KEY to .env.local (user must do this)
- [ ] Polish UI, dark mode, mobile responsive
- [ ] Deploy to Vercel

---

## API Notes
- Claude model: `claude-haiku-4-5-20251001` (fast + cheap for this use case)
- Weather endpoint: `https://api.open-meteo.com/v1/forecast`
- Geolocation: `navigator.geolocation.getCurrentPosition`
- API key stored in `.env.local` as `ANTHROPIC_API_KEY`
