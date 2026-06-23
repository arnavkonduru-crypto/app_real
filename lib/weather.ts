import { Weather } from "./types";

export async function fetchWeather(): Promise<Weather> {
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );
  const { latitude, longitude } = position.coords;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,uv_index&temperature_unit=fahrenheit&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  const c = data.current;
  const tempF = c.temperature_2m;
  const humidity = c.relative_humidity_2m;
  const uvIndex = c.uv_index;
  let description = "Mild";
  if (tempF >= 90) description = "Very Hot";
  else if (tempF >= 80) description = "Hot";
  else if (tempF >= 70) description = "Warm";
  else if (tempF >= 60) description = "Cool";
  else description = "Cold";
  return { tempF, humidity, uvIndex, description };
}
