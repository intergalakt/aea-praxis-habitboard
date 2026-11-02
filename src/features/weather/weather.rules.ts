/**
 * Reine Formatierungs- und Übersetzungsregeln für Wetterdaten (AC-2, AC-10, EC-1, EC-5).
 * Kein Netz, kein Next, keine Uhr: alles, was hier passiert, ist aus Eingaben ableitbar.
 */

export type WeatherDescription = {
  label: string;
  symbol: string;
};

/**
 * WMO-Wettercodes (Open-Meteo liefert `weather_code`).
 * Quelle der Codes: WMO 4677; die Gruppierung folgt der Open-Meteo-Dokumentation.
 */
const WEATHER_CODES: Record<number, WeatherDescription> = {
  0: { label: "Klarer Himmel", symbol: "☀️" },
  1: { label: "Überwiegend klar", symbol: "🌤️" },
  2: { label: "Teilweise bewölkt", symbol: "⛅" },
  3: { label: "Bedeckt", symbol: "☁️" },
  45: { label: "Nebel", symbol: "🌫️" },
  48: { label: "Reifnebel", symbol: "🌫️" },
  51: { label: "Leichter Nieselregen", symbol: "🌦️" },
  53: { label: "Nieselregen", symbol: "🌦️" },
  55: { label: "Starker Nieselregen", symbol: "🌧️" },
  56: { label: "Leichter gefrierender Nieselregen", symbol: "🌧️" },
  57: { label: "Gefrierender Nieselregen", symbol: "🌧️" },
  61: { label: "Leichter Regen", symbol: "🌦️" },
  63: { label: "Regen", symbol: "🌧️" },
  65: { label: "Starker Regen", symbol: "🌧️" },
  66: { label: "Leichter gefrierender Regen", symbol: "🌧️" },
  67: { label: "Gefrierender Regen", symbol: "🌧️" },
  71: { label: "Leichter Schneefall", symbol: "🌨️" },
  73: { label: "Schneefall", symbol: "🌨️" },
  75: { label: "Starker Schneefall", symbol: "❄️" },
  77: { label: "Schneegriesel", symbol: "🌨️" },
  80: { label: "Leichte Regenschauer", symbol: "🌦️" },
  81: { label: "Regenschauer", symbol: "🌧️" },
  82: { label: "Heftige Regenschauer", symbol: "⛈️" },
  85: { label: "Leichte Schneeschauer", symbol: "🌨️" },
  86: { label: "Schneeschauer", symbol: "❄️" },
  95: { label: "Gewitter", symbol: "⛈️" },
  96: { label: "Gewitter mit leichtem Hagel", symbol: "⛈️" },
  99: { label: "Gewitter mit starkem Hagel", symbol: "⛈️" },
};

/** Unbekannte Codes fallen auf einen neutralen Text zurück, statt die Seite zu brechen (EC-4). */
export function describeWeatherCode(code: number): WeatherDescription {
  return WEATHER_CODES[code] ?? { label: "Unbekannte Wetterlage", symbol: "🌡️" };
}

/**
 * Temperatur mit einer Nachkommastelle und deutschem Dezimalkomma: 12.34 → "12,3 °C".
 * Nicht-endliche Werte werden als "–" ausgegeben (kein "NaN °C" in der Oberfläche).
 */
export function formatTemperature(value: number): string {
  if (!Number.isFinite(value)) return "–";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toFixed(1).replace(".", ",")} °C`;
}

/**
 * Open-Meteo liefert mit `timezone=auto` Ortszeit ohne Offset ("2026-11-02T20:15").
 * Daraus wird "02.11.2026, 20:15 Uhr". Unerwartete Formate ergeben einen leeren String,
 * damit die Anzeige nicht mit "Invalid Date" erscheint (EC-4).
 */
export function formatLocalTime(localIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localIso);
  if (!match) return "";
  const [, year, month, day, hour, minute] = match;
  return `${day}.${month}.${year}, ${hour}:${minute} Uhr`;
}

/**
 * Ortsbezeichnung aus den Geocoding-Feldern, ohne Dopplungen
 * (Open-Meteo liefert teils `name` == `admin1`, etwa bei Stadtstaaten).
 */
export function buildPlaceLabel(place: {
  name: string;
  admin1?: string;
  country?: string;
}): string {
  const parts = [place.name, place.admin1, place.country]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return [...new Set(parts)].join(", ");
}

/** Tagesvorhersage für "heute": erste Einträge, defensiv gegen kürzere Arrays (EC-4). */
export function todayRange(daily: {
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}): { max: number; min: number } {
  const max = daily.temperature_2m_max[0];
  const min = daily.temperature_2m_min[0];
  return {
    max: Number.isFinite(max) ? max : Number.NaN,
    min: Number.isFinite(min) ? min : Number.NaN,
  };
}
