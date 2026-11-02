import "server-only";

import { weatherCache, type WeatherCache } from "./weather.cache";
import { fetchForecast, fetchGeocoding, WeatherUpstreamError } from "./weather.client";
import {
  buildPlaceLabel,
  describeWeatherCode,
  formatLocalTime,
  formatTemperature,
  todayRange,
} from "./weather.rules";
import { placeQuerySchema } from "./weather.schema";

type FetchImpl = typeof fetch;

export type WeatherView = {
  place: string;
  country?: string;
  description: string;
  symbol: string;
  temperature: string;
  apparent: string;
  wind: string;
  observedAt: string;
  todayMin: string;
  todayMax: string;
  timezone?: string;
};

export type WeatherFailure = "invalid" | "notfound" | "unavailable";

export type WeatherResult =
  | { ok: true; view: WeatherView }
  | { ok: false; reason: WeatherFailure };

/** Deutsche Hinweise — bewusst hier, damit Seite und Tests dieselbe Quelle nutzen. */
export const WEATHER_MESSAGES: Record<WeatherFailure, string> = {
  invalid: "Bitte gib einen Ort mit mindestens zwei Zeichen ein.",
  notfound: "Für diesen Ort wurden keine Daten gefunden. Prüfe die Schreibweise.",
  unavailable:
    "Wetterdaten sind gerade nicht erreichbar. Bitte versuch es in ein paar Minuten noch einmal.",
};

type Deps = {
  fetchImpl?: FetchImpl;
  cache?: WeatherCache;
};

/**
 * Liefert die Anzeige-Daten für einen Ortsnamen oder einen erklärten Fehlergrund.
 * Wirft nie: jeder Upstream-Fehler wird zu `{ ok: false, reason: "unavailable" }` (AC-5).
 */
export async function getWeatherForPlace(
  rawQuery: string | undefined,
  { fetchImpl = fetch, cache = weatherCache }: Deps = {},
): Promise<WeatherResult> {
  if (!rawQuery) return { ok: false, reason: "invalid" };

  const parsedQuery = placeQuerySchema.safeParse(rawQuery);
  if (!parsedQuery.success) return { ok: false, reason: "invalid" };
  const query = parsedQuery.data;

  try {
    const geocoding = await cache.remember(`geo:${query.toLowerCase()}`, () =>
      fetchGeocoding(query, fetchImpl),
    );

    const place = geocoding.results?.[0];
    if (!place) return { ok: false, reason: "notfound" };

    const forecast = await cache.remember(
      `fc:${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`,
      () => fetchForecast(place.latitude, place.longitude, fetchImpl),
    );

    const { current, daily } = forecast;
    if (!current || !daily) return { ok: false, reason: "unavailable" };

    const { label, symbol } = describeWeatherCode(current.weather_code);
    const range = todayRange(daily);

    return {
      ok: true,
      view: {
        place: buildPlaceLabel(place),
        country: place.country,
        description: label,
        symbol,
        temperature: formatTemperature(current.temperature_2m),
        apparent: formatTemperature(current.apparent_temperature ?? Number.NaN),
        wind:
          current.wind_speed_10m === undefined
            ? "–"
            : `${Math.round(current.wind_speed_10m)} km/h`,
        observedAt: formatLocalTime(current.time),
        todayMin: formatTemperature(range.min),
        todayMax: formatTemperature(range.max),
        timezone: forecast.timezone ?? place.timezone,
      },
    };
  } catch (error) {
    if (error instanceof WeatherUpstreamError) {
      return { ok: false, reason: "unavailable" };
    }
    throw error;
  }
}
