"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Weather } from "@/lib/types";
import { fetchWeather, fetchWeatherByCoords } from "@/lib/weather";
import { CitySuggestion } from "@/app/api/city-suggest/route";
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

  // City search state
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cityWeatherLoading, setCityWeatherLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadByGeo = () => {
    setLoading(true);
    setError(null);
    fetchWeather()
      .then(setWeather)
      .catch((e) => setError(e?.message ?? "Could not get location."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadByGeo(); }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    setSuggestLoading(true);
    try {
      const res = await fetch("/api/city-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setShowDropdown((data.results ?? []).length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const handleCityChange = (val: string) => {
    setCity(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 420);
  };

  const handleSelect = async (s: CitySuggestion) => {
    setCity(s.display);
    setShowDropdown(false);
    setSuggestions([]);
    setCityWeatherLoading(true);
    setError(null);
    try {
      const w = await fetchWeatherByCoords(s.latitude, s.longitude);
      setWeather(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch weather for that city.");
    } finally {
      setCityWeatherLoading(false);
    }
  };

  const uvLabel = (uv: number) =>
    uv <= 2 ? "Low" : uv <= 5 ? "Moderate" : uv <= 7 ? "High" : "Very High";

  return (
    <Card className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-1 text-gray-800">Today&apos;s Weather</h2>
      <p className="text-sm text-gray-500 mb-6">Used to adjust your sweat estimates.</p>

      {loading && (
        <div className="py-8 text-gray-400 animate-pulse">Detecting location…</div>
      )}

      {error && !loading && (
        <div className="space-y-4 mb-4">
          <p className="text-sm text-red-500">{error}</p>

          {/* AI-powered city search */}
          <div className="text-left space-y-1">
            <p className="text-sm font-medium text-gray-600">Enter your city:</p>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                    placeholder="e.g. Austin, TX or NYC"
                    className="input w-full pr-8"
                  />
                  {suggestLoading && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">✦</span>
                  )}
                </div>
              </div>

              {/* Suggestions dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-800 text-sm">{s.name}</span>
                      {(s.admin1 || s.country) && (
                        <span className="text-xs text-gray-400 ml-1.5">
                          {[s.admin1, s.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Try "Austin, TX", "NYC", or "San Fran"</p>
          </div>

          {cityWeatherLoading && (
            <p className="text-sm text-blue-500 animate-pulse">Fetching weather…</p>
          )}

          <button onClick={loadByGeo} className="text-xs text-blue-500 hover:underline">
            Try location again
          </button>
        </div>
      )}

      {weather && (
        <div className="space-y-4 mb-6">
          <div className="text-6xl font-bold text-blue-500">{Math.round(weather.tempF)}°F</div>
          <div className="text-lg font-medium text-gray-600">{weather.description}</div>
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
          {city && (
            <p className="text-xs text-gray-400">📍 {city}</p>
          )}
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
