import { describe, expect, it } from "vitest";

import {
  forecastResponseSchema,
  geocodingResponseSchema,
  placeQuerySchema,
} from "./weather.schema";

describe("placeQuerySchema", () => {
  it("trimmt die Eingabe, bevor sie weitergeht (AC-4)", () => {
    expect(placeQuerySchema.parse("  Freiburg  ")).toBe("Freiburg");
  });

  it("weist Eingaben unter zwei Zeichen ab (AC-9)", () => {
    expect(placeQuerySchema.safeParse("a").success).toBe(false);
    expect(placeQuerySchema.safeParse("  a  ").success).toBe(false);
  });

  it("weist reine Leerzeichen ab", () => {
    expect(placeQuerySchema.safeParse("    ").success).toBe(false);
  });

  it("akzeptiert Umlaute und Bindestriche als normalen Text (EC-2)", () => {
    expect(placeQuerySchema.parse("München")).toBe("München");
    expect(placeQuerySchema.parse("Sankt Goar")).toBe("Sankt Goar");
    expect(placeQuerySchema.parse("Bad Oeynhausen-Lohe")).toBe("Bad Oeynhausen-Lohe");
  });

  it("lässt genau 80 Zeichen zu und lehnt 81 ab", () => {
    expect(placeQuerySchema.safeParse("x".repeat(80)).success).toBe(true);
    expect(placeQuerySchema.safeParse("x".repeat(81)).success).toBe(false);
  });
});

describe("geocodingResponseSchema", () => {
  it("kommt ohne Treffer aus (kein `results`)", () => {
    expect(geocodingResponseSchema.parse({})).toEqual({});
  });

  it("akzeptiert einen Treffer mit optionalen Feldern", () => {
    const parsed = geocodingResponseSchema.parse({
      results: [{ name: "Wien", latitude: 48.2085, longitude: 16.3721 }],
    });
    expect(parsed.results?.[0].name).toBe("Wien");
    expect(parsed.results?.[0].country).toBeUndefined();
  });

  it("lehnt Koordinaten außerhalb des gültigen Bereichs ab (EC-4)", () => {
    const result = geocodingResponseSchema.safeParse({
      results: [{ name: "Nirgendwo", latitude: 91, longitude: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("forecastResponseSchema", () => {
  it("akzeptiert eine typische Antwort mit `current` und `daily`", () => {
    const parsed = forecastResponseSchema.parse({
      timezone: "Europe/Berlin",
      current: { time: "2026-11-02T20:15", temperature_2m: 6.4, weather_code: 2 },
      daily: {
        time: ["2026-11-02"],
        temperature_2m_max: [10.4],
        temperature_2m_min: [0.3],
        weather_code: [2],
      },
    });
    expect(parsed.current?.temperature_2m).toBe(6.4);
    expect(parsed.daily?.temperature_2m_max[0]).toBe(10.4);
  });

  it("erlaubt fehlende Blöcke, damit der Service den Fehlerfall übersetzen kann (AC-5)", () => {
    expect(forecastResponseSchema.parse({}).current).toBeUndefined();
  });

  it("lehnt falsche Typen ab, statt sie bis in die Anzeige zu lassen (EC-4)", () => {
    const result = forecastResponseSchema.safeParse({
      current: { time: "2026-11-02T20:15", temperature_2m: "warm", weather_code: 2 },
    });
    expect(result.success).toBe(false);
  });
});
