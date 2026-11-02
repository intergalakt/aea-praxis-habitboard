/**
 * Zwischenspeicher für Wetterdaten (AC-6, EC-3): TTL 10 Minuten, dazu Single-Flight —
 * parallele Aufrufe mit demselben Schlüssel teilen sich ein Promise statt den Upstream
 * mehrfach zu belasten.
 *
 * Bewusst im Prozessspeicher (wie die Anmelde-Drosselung in HAB-1): kein Schema, keine
 * Migration, keine Nutzdaten. Der Review-Trigger ist eine zweite Instanz.
 */

export const WEATHER_TTL_MS = 10 * 60 * 1000;

type Entry<T> = {
  value?: T;
  expiresAt: number;
  pending?: Promise<T>;
};

export type CacheOptions = {
  ttlMs?: number;
  /** Injizierbare Uhr, damit Tests die TTL ohne Warten prüfen können. */
  now?: () => number;
  /** Obergrenze der Einträge; verhindert unbegrenztes Wachstum bei vielen Orten. */
  maxEntries?: number;
};

export type WeatherCache = {
  remember<T>(key: string, loader: () => Promise<T>): Promise<T>;
  size(): number;
  clear(): void;
};

export function createWeatherCache({
  ttlMs = WEATHER_TTL_MS,
  now = Date.now,
  maxEntries = 200,
}: CacheOptions = {}): WeatherCache {
  const entries = new Map<string, Entry<unknown>>();

  function evictIfNeeded() {
    if (entries.size <= maxEntries) return;
    // Ältester Eintrag zuerst (Map bewahrt die Einfügereihenfolge).
    const oldest = entries.keys().next();
    if (!oldest.done) entries.delete(oldest.value);
  }

  return {
    remember<T>(key: string, loader: () => Promise<T>): Promise<T> {
      const hit = entries.get(key) as Entry<T> | undefined;

      if (hit) {
        if (hit.pending) return hit.pending;
        if (hit.value !== undefined && hit.expiresAt > now()) {
          return Promise.resolve(hit.value);
        }
        entries.delete(key);
      }

      const pending = loader()
        .then((value) => {
          entries.set(key, { value, expiresAt: now() + ttlMs });
          evictIfNeeded();
          return value;
        })
        .catch((error: unknown) => {
          // Fehler nicht cachen: der nächste Aufruf darf es erneut versuchen (EC-3).
          entries.delete(key);
          throw error;
        });

      entries.set(key, { expiresAt: now() + ttlMs, pending });
      return pending;
    },

    size() {
      return entries.size;
    },

    clear() {
      entries.clear();
    },
  };
}

/** Prozessweiter Speicher für Geocoding- und Vorhersage-Antworten. */
export const weatherCache = createWeatherCache();
