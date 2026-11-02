import { describe, expect, it } from "vitest";

import { createWeatherCache, WEATHER_TTL_MS } from "./weather.cache";

const T0 = 1_700_000_000_000;

function countingLoader<T>(value: T) {
  let calls = 0;
  const load = () => {
    calls += 1;
    return Promise.resolve(value);
  };
  return { load, calls: () => calls };
}

describe("weather.cache", () => {
  it("cached einen Treffer und ruft den Loader nur einmal (AC-6)", async () => {
    let clock = T0;
    const cache = createWeatherCache({ now: () => clock });
    const { load, calls } = countingLoader({ temperature: 12 });

    await cache.remember("geo:freiburg", load);
    await cache.remember("geo:freiburg", load);

    expect(calls()).toBe(1);
    expect(cache.size()).toBe(1);
  });

  it("lädt nach Ablauf der TTL neu (10 Minuten)", async () => {
    let clock = T0;
    const cache = createWeatherCache({ now: () => clock });
    const { load, calls } = countingLoader("wert");

    await cache.remember("fc:1,2", load);
    clock = T0 + WEATHER_TTL_MS - 1;
    await cache.remember("fc:1,2", load);
    expect(calls()).toBe(1);

    clock = T0 + WEATHER_TTL_MS + 1;
    await cache.remember("fc:1,2", load);
    expect(calls()).toBe(2);
  });

  it("teilt parallele Aufrufe (Single-Flight), statt doppelt zu laden", async () => {
    const cache = createWeatherCache();
    const { load, calls } = countingLoader("parallel");

    const [a, b] = await Promise.all([
      cache.remember("fc:9,9", load),
      cache.remember("fc:9,9", load),
    ]);

    expect(a).toBe("parallel");
    expect(b).toBe("parallel");
    expect(calls()).toBe(1);
  });

  it("cached Fehler nicht — der nächste Aufruf versucht es erneut (EC-3)", async () => {
    const cache = createWeatherCache();
    let attempts = 0;
    const load = () => {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error("Timeout")) : Promise.resolve("ok");
    };

    await expect(cache.remember("geo:x", load)).rejects.toThrow("Timeout");
    await expect(cache.remember("geo:x", load)).resolves.toBe("ok");
    expect(attempts).toBe(2);
  });

  it("begrenzt die Zahl der Einträge (kein unbegrenztes Wachstum)", async () => {
    const cache = createWeatherCache({ maxEntries: 2 });
    await cache.remember("a", () => Promise.resolve(1));
    await cache.remember("b", () => Promise.resolve(2));
    await cache.remember("c", () => Promise.resolve(3));

    expect(cache.size()).toBe(2);
  });

  it("folgt dem Schlüssel exakt — Groß-/Kleinschreibung liegt beim Aufrufer", async () => {
    const cache = createWeatherCache();
    await cache.remember("geo:Wien", () => Promise.resolve(1));
    await cache.remember("geo:wien", () => Promise.resolve(2));
    expect(cache.size()).toBe(2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
