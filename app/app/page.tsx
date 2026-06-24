"use client";
import { useState } from "react";
import { UserProfile, Weather } from "@/lib/types";
import { saveProfile, loadProfile } from "@/lib/storage";
import LoginForm from "@/components/auth/LoginForm";
import PreferredNameForm from "@/components/auth/PreferredNameForm";
import ProfileForm from "@/components/profile/ProfileForm";
import ActivityLevelForm from "@/components/profile/ActivityLevelForm";
import WeatherCard from "@/components/weather/WeatherCard";
import HomeScreen from "@/components/home/HomeScreen";

type Step = "login" | "name" | "profile" | "activityLevel" | "weather" | "home";

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
  const [weather, setWeather] = useState<Weather | null>(null);

  const handleProfile = (p: UserProfile) => {
    saveProfile(p);
    setProfile(p);
    setStep("activityLevel");
  };

  return (
    <main className="min-h-screen px-4 py-10" style={BG}>
      <div className="max-w-2xl mx-auto">
        {step !== "home" && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900" style={{ letterSpacing: "-0.02em" }}>Aqua</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Personalized hydration — built around you, not a formula
            </p>
          </div>
        )}

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
            onSubmit={() => setStep("weather")}
            onBack={() => setStep("profile")}
          />
        )}
        {step === "weather" && (
          <WeatherCard
            onConfirm={(w) => { setWeather(w); setStep("home"); }}
            onBack={() => setStep("activityLevel")}
          />
        )}
        {step === "home" && profile && weather && (
          <HomeScreen profile={profile} weather={weather} preferredName={preferredName} />
        )}
      </div>
    </main>
  );
}
