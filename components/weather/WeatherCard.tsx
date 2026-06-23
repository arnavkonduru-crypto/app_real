"use client";
import { useEffect, useState } from "react";
import { Weather } from "@/lib/types";
import { fetchWeather } from "@/lib/weather";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Props {
  onConfirm: (weather: Weather) => void;
  onBack: () => void;
}

export default function WeatherCard({ onConfirm, onBack }: Props) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather()
      .then(setWeather)
      .catch(() => setError("Could not get location. Please allow location access."))
      .finally(() => setLoading(false));
  }, []);

  const uvLabel = (uv: number) =>
    uv <= 2 ? "Low" : uv <= 5 ? "Moderate" : uv <= 7 ? "High" : "Very High";

  return (
    <Card className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-1 text-gray-800 dark:text-white">
        Today&apos;s Weather
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Fetched from your location to adjust sweat estimates.
      </p>

      {loading && (
        <div className="py-8 text-gray-400 animate-pulse">Detecting location…</div>
      )}

      {error && (
        <div className="py-4 text-red-500 text-sm">{error}</div>
      )}

      {weather && (
        <div className="space-y-4 mb-6">
          <div className="text-6xl font-bold text-blue-500">
            {Math.round(weather.tempF)}°F
          </div>
          <div className="text-lg font-medium text-gray-600 dark:text-gray-300">
            {weather.description}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-600">{weather.humidity}%</div>
              <div className="text-xs text-gray-500 mt-1">Humidity</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
              <div className="text-2xl font-bold text-orange-500">{weather.uvIndex.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">UV Index — {uvLabel(weather.uvIndex)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>← Back</Button>
        <Button onClick={() => weather && onConfirm(weather)} disabled={!weather} className="flex-1">
          Calculate →
        </Button>
      </div>
    </Card>
  );
}
