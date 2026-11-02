import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSessionUser } from "@/features/auth/auth.hooks";
import { HabitForm } from "@/features/habits/components/habit-form";
import { HabitList } from "@/features/habits/components/habit-list";
import type { HabitErrorCode } from "@/features/habits/habit.actions";
import { listForUser } from "@/features/habits/habit.repository";
import { toIsoDate } from "@/features/habits/habit.rules";

export const metadata: Metadata = {
  title: "Board · HabitBoard",
};

/** Fehlercodes aus den Actions in Sätze übersetzen — ohne interne Details. */
const ERRORS: Record<HabitErrorCode, string> = {
  name: "Bitte gib einen Namen mit 1 bis 80 Zeichen ein.",
  create: "Die Gewohnheit konnte nicht angelegt werden. Bitte erneut versuchen.",
  toggle: "Der Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.",
  remove: "Die Gewohnheit konnte nicht gelöscht werden. Bitte erneut versuchen.",
};

function errorMessage(code: string | string[] | undefined): string | null {
  const key = Array.isArray(code) ? code[0] : code;
  if (!key) return null;
  return key in ERRORS ? ERRORS[key as HabitErrorCode] : null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fehler?: string | string[] }>;
}) {
  const user = await getSessionUser();
  const today = toIsoDate(new Date());
  const result = await listForUser(today);
  const message = errorMessage((await searchParams).fehler);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dein Board</h1>
        <p className="text-sm text-muted-foreground">
          Angemeldet als {user?.email ?? "unbekannt"}. Heute ist der{" "}
          {today.split("-").reverse().join(".")}.
        </p>
      </div>

      {message ? (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <HabitForm />

      {result.ok ? (
        <HabitList habits={result.habits} today={today} />
      ) : (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
