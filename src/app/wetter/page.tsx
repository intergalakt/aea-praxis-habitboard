import type { Metadata } from "next";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { WeatherAttribution } from "@/features/weather/components/weather-attribution";
import { WeatherCard } from "@/features/weather/components/weather-card";
import { WeatherSearch } from "@/features/weather/components/weather-search";
import { getWeatherForPlace, WEATHER_MESSAGES } from "@/features/weather/weather.service";

export const metadata: Metadata = {
  title: "Wetter · HabitBoard",
  description: "Aktuelles Wetter und Tagesvorhersage für deinen Ort.",
};

/** Öffentlich erreichbar, kein Login (AC-1); Daten werden ausschließlich serverseitig geholt (AC-7). */
export default async function WetterPage({
  searchParams,
}: {
  searchParams: Promise<{ ort?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawOrt = Array.isArray(params.ort) ? params.ort[0] : params.ort;
  const result = rawOrt === undefined ? null : await getWeatherForPlace(rawOrt);

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <nav className="flex items-center justify-between text-sm">
        <Link className="font-medium underline underline-offset-4" href="/">
          HabitBoard
        </Link>
        <Link className="text-muted-foreground underline underline-offset-4" href="/login">
          Anmelden
        </Link>
      </nav>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Wetter</h1>
        <p className="text-sm text-muted-foreground">
          Aktuelles Wetter und die Spanne für heute — ohne Konto.
        </p>
      </div>

      <WeatherSearch defaultValue={rawOrt ?? ""} />

      <div aria-live="polite">
        {result === null ? (
          <p className="text-sm text-muted-foreground">Gib einen Ort ein, um das Wetter zu sehen.</p>
        ) : result.ok ? (
          <WeatherCard view={result.view} />
        ) : (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{WEATHER_MESSAGES[result.reason]}</AlertDescription>
          </Alert>
        )}
      </div>

      <footer className="border-t pt-4">
        <WeatherAttribution />
      </footer>
    </main>
  );
}
