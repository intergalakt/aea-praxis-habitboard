import "server-only";

import type { ZodType } from "zod";

import {
  forecastResponseSchema,
  geocodingResponseSchema,
  type ForecastResponse,
  type GeocodingResponse,
} from "./weather.schema";

const TIMEOUT_MS = 3000;
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type FetchImpl = typeof fetch;

/**
 * Jeder unerwartete Zustand des fremden Dienstes (HTTP-Fehler, Timeout, Schema-Abweichung)
 * landet hier — der Service übersetzt das in einen deutschen Hinweis (AC-5, EC-4).
 * Die Meldung enthält bewusst keine URL und keinen Stacktrace.
 */
export class WeatherUpstreamError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WeatherUpstreamError";
  }
}

async function getJson<T>(
  url: string,
  schema: ZodType<T>,
  fetchImpl: FetchImpl,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      headers: { accept: "application/json" },
    });
  } catch (error) {
    // Netzfehler und Timeout (AbortError) landen beide hier.
    throw new WeatherUpstreamError("Upstream nicht erreichbar", error);
  }

  if (!response.ok) {
    throw new WeatherUpstreamError(`Upstream antwortete mit ${response.status}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new WeatherUpstreamError("Upstream lieferte kein JSON", error);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new WeatherUpstreamError("Upstream-Antwort passt nicht zum Schema");
  }

  return parsed.data;
}

/** Ortsvorschläge; `count=5` hält die Antwort klein (Spec: höchstens fünf Treffer). */
export function buildGeocodingUrl(query: string): string {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "de");
  url.searchParams.set("format", "json");
  return url.toString();
}

/** Aktuelles Wetter + Tageshöchst/-tiefstwerte in Ortszeit. */
export function buildForecastUrl(latitude: number, longitude: number): string {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
  );
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");
  return url.toString();
}

export function fetchGeocoding(
  query: string,
  fetchImpl: FetchImpl = fetch,
): Promise<GeocodingResponse> {
  return getJson(buildGeocodingUrl(query), geocodingResponseSchema, fetchImpl);
}

export function fetchForecast(
  latitude: number,
  longitude: number,
  fetchImpl: FetchImpl = fetch,
): Promise<ForecastResponse> {
  return getJson(buildForecastUrl(latitude, longitude), forecastResponseSchema, fetchImpl);
}
