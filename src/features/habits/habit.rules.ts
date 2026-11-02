/**
 * Reine Regeln für Gewohnheiten (AC-4, AC-5, EC-2). Kein `new Date()` in diesen
 * Funktionen: „heute“ kommt immer als Parameter herein (`YYYY-MM-DD`), damit
 * Tests mit festem Datum laufen und das Ergebnis nicht von der Uhr abhängt.
 */

/** Wandelt `YYYY-MM-DD` in einen UTC-Zeitstempel — vermeidet Zeitzonen-Sprünge. */
function toUtc(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** `YYYY-MM-DD` plus `days` (auch negativ), zeitzonensicher. */
export function addDays(isoDate: string, days: number): string {
  const shifted = new Date(toUtc(isoDate) + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

/** Kalendertag eines Zeitpunkts in UTC — der Server ist die Referenz (Data Model). */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Aktuelle Serie in Tagen (AC-5).
 *
 * Gezählt wird rückwärts ab heute. Ist heute noch offen, wird ab gestern
 * gezählt — sonst stünde morgens jede Serie auf 0, obwohl gestern erledigt
 * wurde. Fehlt auch gestern, ist die Serie 0.
 */
export function calculateStreak(entryDates: readonly string[], today: string): number {
  const done = new Set(entryDates);

  let cursor = done.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (done.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/** Zerlegt eine Serie in eine gut lesbare Form für die Oberfläche. */
export function formatStreak(streak: number): string {
  if (streak <= 0) return "Noch keine Serie";
  if (streak === 1) return "1 Tag in Folge";
  return `${streak} Tage in Folge`;
}

/** Zusammenfassung „X von Y heute erledigt“ (AC-4). */
export function summarizeToday(
  habits: readonly { entryDates: readonly string[] }[],
  today: string,
): { done: number; total: number } {
  return {
    done: habits.filter((habit) => habit.entryDates.includes(today)).length,
    total: habits.length,
  };
}

/** Deutsche Beschriftung für die Zusammenfassung; Leerzustand separat (AC-7). */
export function formatProgress({ done, total }: { done: number; total: number }): string {
  if (total === 0) return "Noch keine Gewohnheit angelegt.";
  return `${done} von ${total} heute erledigt`;
}

/** Sortiert Einträge absteigend und entfernt Duplikate — Eingabe für die Serie. */
export function uniqueDates(entryDates: readonly string[]): string[] {
  return [...new Set(entryDates)].sort().reverse();
}
