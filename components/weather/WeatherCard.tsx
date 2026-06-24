"use client";
import { useEffect, useState } from "react";
import { Weather } from "@/lib/types";
import { fetchWeather, fetchWeatherByCity } from "@/lib/weather";
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
  const [city, setCity] = useState("");
  const [cityLoading, setCityLoading] = useState(false);

  const loadByGeo = () => {
    setLoading(true);
    setError(null);
    fetchWeather()
      .then(setWeather)
      .catch((e) => setError(e?.message ?? "Could not get location."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadByGeo(); }, []);

  const handleCitySubmit = async () => {
    if (!city.trim()) return;
    setCityLoading(true);
    setError(null);
    try {
      const w = await fetchWeatherByCity(city.trim());
      setWeather(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "City not found.");
    } finally {
      setCityLoading(false);
    }
  };

  const uvLabel = (uv: number) =>
    uv <= 2 ? "Low" : uv <= 5 ? "Moderate" : uv <= 7 ? "High" : "Very High";

  return (
    <Card className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-1 text-gray-800">Today&apos;s Weather</h2>
      <p className="text-sm text-gray-500 mb-6">
        Used to adjust your sweat estimates.
      </p>

      {loading && (
        <div className="py-8 text-gray-400 animate-pulse">Detecting location…</div>
      )}

      {error && !loading && (
        <div className="space-y-4 mb-4">
          <p className="text-sm text-red-500">{error}</p>

          {/* Manual city fallback */}
          <div className="text-left space-y-2">
            <p className="text-sm font-medium text-gray-600">Enter your city instead:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCitySubmit()}
                placeholder="e.g. Austin, TX"
                className="input flex-1"
              />
              <Button onClick={handleCitySubmit} disabled={cityLoading || !city.trim()}>
                {cityLoading ? "…" : "Go"}
              </Button>
            </div>
          </div>

          <button
            onClick={loadByGeo}
            className="text-xs text-blue-500 hover:underline"
          >
            Try location again
          </button>
        </div>
      )}

      {weather && (
        <div className="space-y-4 mb-6">
          <div className="text-6xl font-bold text-blue-500">
            {Math.round(weather.tempF)}°F
          </div>
          <div className="text-lg font-medium text-gray-600">
            {weather.description}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-600">{weather.humidity}%</div>
              <div className="text-xs text-gray-500 mt-1">Humidity</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-orange-500">{weather.uvIndex.toFixed(1)}</div>
              <div className="text-xs text-gray-500 mt-1">UV — {uvLabel(weather.uvIndex)}</div>
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
