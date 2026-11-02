import { describe, expect, it } from "vitest";

import { createWeatherCache } from "./weather.cache";
import { getWeatherForPlace, WEATHER_MESSAGES } from "./weather.service";

const GEO_OK = {
  results: [
    {
      name: "Freiburg im Breisgau",
      latitude: 47.9959,
      longitude: 7.8522,
      country: "Deutschland",
      admin1: "Baden-Württemberg",
      timezone: "Europe/Berlin",
    },
  ],
};

const FORECAST_OK = {
  timezone: "Europe/Berlin",
  current: {
    time: "2026-11-02T20:15",
    temperature_2m: 11.4,
    apparent_temperature: 9.2,
    weather_code: 3,
    wind_speed_10m: 7.6,
  },
  daily: {
    time: ["2026-11-02"],
    temperature_2m_max: [13.1],
    temperature_2m_min: [6.8],
    weather_code: [3],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Zählt Aufrufe und liefert je URL die passende Antwort. */
function stubFetch(map: (url: string) => Response | Promise<Response>) {
  const calls: string[] = [];
  const impl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return map(url);
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const okFetch = () =>
  stubFetch((url) =>
    url.includes("geocoding-api")
      ? jsonResponse(GEO_OK)
      : jsonResponse(FORECAST_OK),
  );

describe("weather.service", () => {
  it("liefert fertig formatierte Anzeige-Daten (AC-3, AC-10)", async () => {
    const { impl } = okFetch();
    const result = await getWeatherForPlace("Freiburg", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.view.place).toBe("Freiburg im Breisgau, Baden-Württemberg, Deutschland");
    expect(result.view.temperature).toBe("11,4 °C");
    expect(result.view.apparent).toBe("9,2 °C");
    expect(result.view.todayMin).toBe("6,8 °C");
    expect(result.view.todayMax).toBe("13,1 °C");
    expect(result.view.description).toBe("Bedeckt");
    expect(result.view.observedAt).toBe("02.11.2026, 20:15 Uhr");
    expect(result.view.wind).toBe("8 km/h");
  });

  it("weist zu kurze Ortsnamen ab, ohne den Upstream zu fragen (AC-9)", async () => {
    const { impl, calls } = okFetch();
    const result = await getWeatherForPlace("a", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(WEATHER_MESSAGES.invalid).toContain("mindestens zwei Zeichen");
    expect(calls).toHaveLength(0);
  });

  it("meldet einen unbekannten Ort verständlich (EC-4)", async () => {
    const { impl } = stubFetch(() => jsonResponse({}));
    const result = await getWeatherForPlace("Xyzzyx", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result).toEqual({ ok: false, reason: "notfound" });
    expect(WEATHER_MESSAGES.notfound).toContain("keine Daten gefunden");
  });

  it("übersetzt HTTP-Fehler des Upstreams in 'unavailable' (AC-5)", async () => {
    const { impl } = stubFetch(() => jsonResponse({ error: true }, 503));
    const result = await getWeatherForPlace("Freiburg", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result).toEqual({ ok: false, reason: "unavailable" });
    expect(WEATHER_MESSAGES.unavailable).toContain("nicht erreichbar");
  });

  it("fängt Netzwerkfehler und Timeouts ab, statt zu werfen (AC-5)", async () => {
    const { impl } = stubFetch(() => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });
    const result = await getWeatherForPlace("Freiburg", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });

  it("lehnt Antworten ab, die nicht zum Schema passen (EC-4)", async () => {
    const { impl } = stubFetch((url) =>
      url.includes("geocoding-api")
        ? jsonResponse(GEO_OK)
        : jsonResponse({ current: { time: "2026-11-02T20:15" } }),
    );
    const result = await getWeatherForPlace("Freiburg", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result).toEqual({ ok: false, reason: "unavailable" });
  });

  it("fragt bei identischem Ort innerhalb der TTL nur einmal je Upstream (AC-6)", async () => {
    const { impl, calls } = okFetch();
    const cache = createWeatherCache();

    await getWeatherForPlace("Freiburg", { fetchImpl: impl, cache });
    await getWeatherForPlace("FREIBURG ", { fetchImpl: impl, cache });

    expect(calls).toHaveLength(2);
    expect(calls.filter((url) => url.includes("geocoding-api"))).toHaveLength(1);
  });

  it("zeigt unbekannte Wettercodes als neutralen Text, nicht als Fehler (EC-4)", async () => {
    const { impl } = stubFetch((url) =>
      url.includes("geocoding-api")
        ? jsonResponse(GEO_OK)
        : jsonResponse({
            ...FORECAST_OK,
            current: { ...FORECAST_OK.current, weather_code: 4242 },
          }),
    );
    const result = await getWeatherForPlace("Freiburg", {
      fetchImpl: impl,
      cache: createWeatherCache(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.view.description).toBe("Unbekannte Wetterlage");
  });
});
