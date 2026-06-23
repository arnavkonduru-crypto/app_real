"use client";
import { useState } from "react";
import { UserProfile, Activity, Weather, HydrationResult } from "@/lib/types";
import { saveProfile, loadProfile } from "@/lib/storage";
import StepIndicator from "@/components/ui/StepIndicator";
import ProfileForm from "@/components/profile/ProfileForm";
import ActivityPicker from "@/components/activities/ActivityPicker";
import WeatherCard from "@/components/weather/WeatherCard";
import ResultsDashboard from "@/components/results/ResultsDashboard";

type Step = "profile" | "activities" | "weather" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(loadProfile);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [result, setResult] = useState<HydrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = { profile: 0, activities: 1, weather: 2, results: 3 }[step];

  const handleProfile = (p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setStep("activities");
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
    setStep("profile");
    setActivities([]);
    setWeather(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            💧 HydroAI
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Personalized hydration — built around you, not a formula
          </p>
        </div>

        {step !== "results" && <StepIndicator current={stepIndex} />}

        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl animate-bounce mb-4">💧</div>
            <p className="text-gray-500">Calculating your plan…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm mb-4">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {!loading && (
          <>
            {step === "profile" && (
              <ProfileForm initial={profile} onSubmit={handleProfile} />
            )}
            {step === "activities" && (
              <ActivityPicker
                onSubmit={handleActivities}
                onBack={() => setStep("profile")}
              />
            )}
            {step === "weather" && (
              <WeatherCard
                onConfirm={handleWeather}
                onBack={() => setStep("activities")}
              />
            )}
            {step === "results" && result && (
              <ResultsDashboard result={result} onReset={reset} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
