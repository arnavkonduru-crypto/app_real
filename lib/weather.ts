import { Weather } from "./types";

export async function fetchWeatherByCoords(latitude: number, longitude: number): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,uv_index&temperature_unit=fahrenheit&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();
  const c = data.current;
  const tempF = c.temperature_2m;
  const humidity = c.relative_humidity_2m;
  const uvIndex = c.uv_index ?? 0;
  let description = "Mild";
  if (tempF >= 90) description = "Very Hot";
  else if (tempF >= 80) description = "Hot";
  else if (tempF >= 70) description = "Warm";
  else if (tempF >= 60) description = "Cool";
  else description = "Cold";
  return { tempF, humidity, uvIndex, description };
}

export async function fetchWeatherByCity(city: string): Promise<Weather> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );
  const geoData = await geoRes.json();
  if (!geoData.results?.length) throw new Error("City not found");
  const { latitude, longitude } = geoData.results[0];
  return fetchWeatherByCoords(latitude, longitude);
}

export async function fetchWeather(): Promise<Weather> {
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
  );
  return fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
}
