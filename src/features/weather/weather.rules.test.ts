import { describe, expect, it } from "vitest";

import {
  buildPlaceLabel,
  describeWeatherCode,
  formatLocalTime,
  formatTemperature,
  todayRange,
} from "./weather.rules";

describe("weather.rules", () => {
  it("übersetzt dokumentierte WMO-Codes ins Deutsche (AC-3)", () => {
    expect(describeWeatherCode(0).label).toBe("Klarer Himmel");
    expect(describeWeatherCode(3).label).toBe("Bedeckt");
    expect(describeWeatherCode(61).label).toBe("Leichter Regen");
    expect(describeWeatherCode(95).label).toBe("Gewitter");
  });

  it("bleibt bei unbekannten Codes neutral statt zu werfen (EC-4)", () => {
    for (const code of [-1, 7, 42, 100, 999]) {
      expect(describeWeatherCode(code)).toEqual({
        label: "Unbekannte Wetterlage",
        symbol: "🌡️",
      });
    }
  });

  it("formatiert Temperaturen mit deutschem Komma und einer Stelle (AC-10)", () => {
    expect(formatTemperature(12)).toBe("12,0 °C");
    expect(formatTemperature(12.34)).toBe("12,3 °C");
    // Halbe Werte runden in JS zur größeren Zahl (Math.round(-32.5) === -32),
    // deshalb -3,2 statt -3,3 — dokumentiert, damit es niemand für einen Fehler hält.
    expect(formatTemperature(-3.25)).toBe("-3,2 °C");
    expect(formatTemperature(-3.26)).toBe("-3,3 °C");
    expect(formatTemperature(0)).toBe("0,0 °C");
  });

  it("gibt für fehlende oder unendliche Werte einen Gedankenstrich aus (EC-4)", () => {
    expect(formatTemperature(Number.NaN)).toBe("–");
    expect(formatTemperature(Number.POSITIVE_INFINITY)).toBe("–");
  });

  it("formatiert die Ortszeit aus dem Open-Meteo-Format (AC-3)", () => {
    expect(formatLocalTime("2026-11-02T20:15")).toBe("02.11.2026, 20:15 Uhr");
    expect(formatLocalTime("2026-01-09T00:05:31")).toBe("09.01.2026, 00:05 Uhr");
  });

  it("liefert bei unerwartetem Zeitformat einen leeren String (EC-4)", () => {
    expect(formatLocalTime("")).toBe("");
    expect(formatLocalTime("2026-11-02")).toBe("");
    expect(formatLocalTime("gestern")).toBe("");
  });

  it("baut den Ortsnamen ohne Dopplungen (AC-3)", () => {
    expect(
      buildPlaceLabel({ name: "Freiburg", admin1: "Baden-Württemberg", country: "Deutschland" }),
    ).toBe("Freiburg, Baden-Württemberg, Deutschland");
    expect(buildPlaceLabel({ name: "Berlin", admin1: "Berlin", country: "Deutschland" })).toBe(
      "Berlin, Deutschland",
    );
    expect(buildPlaceLabel({ name: " Wien ", country: "Österreich" })).toBe("Wien, Österreich");
    expect(buildPlaceLabel({ name: "Wien" })).toBe("Wien");
  });

  it("nimmt die Tagesspanne aus dem ersten Eintrag (AC-3, forecast_days=1)", () => {
    expect(todayRange({ temperature_2m_max: [13.1, 12], temperature_2m_min: [6.8, 5] })).toEqual({
      max: 13.1,
      min: 6.8,
    });
  });

  it("verkraftet leere Tagesarrays ohne Ausnahme (EC-4)", () => {
    const range = todayRange({ temperature_2m_max: [], temperature_2m_min: [] });
    expect(range.max).toBeNaN();
    expect(range.min).toBeNaN();
  });
});
