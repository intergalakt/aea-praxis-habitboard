import { describe, expect, it } from "vitest";

import {
  buildGeocodingUrl,
  buildForecastUrl,
  WeatherUpstreamError,
} from "./weather.client";

describe("weather.client URLs", () => {
  it("fragt Geocoding auf Deutsch ab und begrenzt auf fünf Treffer (AC-2)", () => {
    const url = new URL(buildGeocodingUrl("Freiburg im Breisgau"));
    expect(url.origin + url.pathname).toBe("https://geocoding-api.open-meteo.com/v1/search");
    expect(url.searchParams.get("name")).toBe("Freiburg im Breisgau");
    expect(url.searchParams.get("count")).toBe("5");
    expect(url.searchParams.get("language")).toBe("de");
  });

  it("kodiert Sonderzeichen im Ortsnamen als Query-Parameter (AC-9)", () => {
    const url = new URL(buildGeocodingUrl("Sankt Peter-Ording & Co"));
    expect(url.searchParams.get("name")).toBe("Sankt Peter-Ording & Co");
    expect(url.search).not.toContain("&Co");
  });

  it("fragt aktuelle Werte und die Tagesspanne in Ortszeit ab (AC-3, AC-10)", () => {
    const url = new URL(buildForecastUrl(47.999, 7.8421));
    expect(url.searchParams.get("latitude")).toBe("47.9990");
    expect(url.searchParams.get("longitude")).toBe("7.8421");
    expect(url.searchParams.get("current")).toContain("temperature_2m");
    expect(url.searchParams.get("current")).toContain("weather_code");
    expect(url.searchParams.get("daily")).toContain("temperature_2m_min");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("forecast_days")).toBe("1");
  });

  it("reicht keine Secrets mit — Open-Meteo braucht keinen Schlüssel (AC-7)", () => {
    const url = buildForecastUrl(52.52, 13.405);
    expect(url).not.toMatch(/api[_-]?key|token|secret/i);
  });

  it("exportiert einen eigenen Fehlertyp, damit der Service gezielt übersetzen kann (AC-5)", () => {
    const error = new WeatherUpstreamError("kaputt");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("WeatherUpstreamError");
  });
});
