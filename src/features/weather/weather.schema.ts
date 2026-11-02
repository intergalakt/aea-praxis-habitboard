import { z } from "zod";

/**
 * Ortsname aus dem Formular: getrimmt, 2–80 Zeichen.
 * Bewusst nur Text — der Wert wird nie in SQL, HTML oder Shell weitergereicht,
 * er geht ausschließlich als Query-Parameter an Open-Meteo (AC-9).
 */
export const placeQuerySchema = z
  .string()
  .trim()
  .min(2, "Bitte gib mindestens zwei Zeichen ein.")
  .max(80, "Der Ortsname ist zu lang (maximal 80 Zeichen).");

export type PlaceQuery = z.infer<typeof placeQuerySchema>;

/** Antwort von geocoding-api.open-meteo.com. Felder, die wir nicht nutzen, werden ignoriert. */
export const geocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().min(1),
        latitude: z.number().gte(-90).lte(90),
        longitude: z.number().gte(-180).lte(180),
        country: z.string().optional(),
        admin1: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

export type GeocodingResponse = z.infer<typeof geocodingResponseSchema>;
export type GeocodingPlace = NonNullable<GeocodingResponse["results"]>[number];

/** Antwort von api.open-meteo.com/v1/forecast (nur die angefragten Felder). */
export const forecastResponseSchema = z.object({
  timezone: z.string().optional(),
  current: z
    .object({
      time: z.string().min(1),
      temperature_2m: z.number(),
      apparent_temperature: z.number().optional(),
      weather_code: z.number().int(),
      wind_speed_10m: z.number().optional(),
    })
    .optional(),
  daily: z
    .object({
      time: z.array(z.string()).min(1),
      temperature_2m_max: z.array(z.number()),
      temperature_2m_min: z.array(z.number()),
      weather_code: z.array(z.number().int()),
    })
    .optional(),
});

export type ForecastResponse = z.infer<typeof forecastResponseSchema>;
