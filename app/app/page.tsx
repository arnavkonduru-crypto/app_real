"use client";
import { useState } from "react";
import { UserProfile, Activity, Weather, HydrationResult } from "@/lib/types";
import { saveProfile, loadProfile } from "@/lib/storage";
import StepIndicator from "@/components/ui/StepIndicator";
import LoginForm from "@/components/auth/LoginForm";
import PreferredNameForm from "@/components/auth/PreferredNameForm";
import ProfileForm from "@/components/profile/ProfileForm";
import ActivityLevelForm from "@/components/profile/ActivityLevelForm";
import HydrateScreen from "@/components/ui/HydrateScreen";
import ActivityPicker from "@/components/activities/ActivityPicker";
import WeatherCard from "@/components/weather/WeatherCard";
import ResultsDashboard from "@/components/results/ResultsDashboard";

type Step = "login" | "name" | "profile" | "activityLevel" | "hydrate" | "activities" | "weather" | "results";

const BG = {
  backgroundColor: "#f0ede8",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
};

export default function Home() {
  const [step, setStep] = useState<Step>("login");
  const [preferredName, setPreferredName] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    typeof window === "undefined" ? null : loadProfile()
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [result, setResult] = useState<HydrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = { login: 0, name: 0, profile: 0, activityLevel: 0, hydrate: 0, activities: 1, weather: 2, results: 3 }[step];
  const hideStepIndicator = ["login", "name", "activityLevel", "hydrate", "results"].includes(step);

  const handleProfile = (p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setStep("activityLevel");
  };

  const handleActivities = (acts: Activity[]) => {
    setActivities(acts);
    setStep("weather");
  };

  const handleWeather = async (w: Weather) => {
    setWeather(w);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hydration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, activities, weather: w }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("login");
    setActivities([]);
    setWeather(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen px-4 py-10" style={BG}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>Aqua</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Personalized hydration — built around you, not a formula
          </p>
        </div>

        {!hideStepIndicator && <StepIndicator current={stepIndex} />}

        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl animate-bounce mb-4"></div>
            <p className="text-gray-500">Calculating your plan…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {!loading && (
          <>
            {step === "login" && <LoginForm onLogin={() => setStep("name")} />}
            {step === "name" && (
              <PreferredNameForm onSubmit={(name) => { setPreferredName(name); setStep("profile"); }} />
            )}
            {step === "profile" && (
              <ProfileForm initial={profile} onSubmit={handleProfile} preferredName={preferredName} />
            )}
            {step === "activityLevel" && (
              <ActivityLevelForm
                preferredName={preferredName}
                onSubmit={() => setStep("hydrate")}
                onBack={() => setStep("profile")}
              />
            )}
            {step === "hydrate" && (
              <HydrateScreen preferredName={preferredName} onHydrate={() => setStep("activities")} />
            )}
            {step === "activities" && (
              <ActivityPicker onSubmit={handleActivities} onBack={() => setStep("hydrate")} />
            )}
            {step === "weather" && (
              <WeatherCard onConfirm={handleWeather} onBack={() => setStep("activities")} />
            )}
            {step === "results" && result && (
              <ResultsDashboard result={result} onReset={reset} preferredName={preferredName} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
