import type { Metadata } from "next";
import Link from "next/link";

import { ConfigNotice } from "@/features/auth/components/config-notice";
import { LoginForm } from "@/features/auth/components/login-form";
import { isAuthConfigured, safeNextPath } from "@/features/auth/auth.rules";

export const metadata: Metadata = {
  title: "Anmelden · HabitBoard",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Anmelden</h1>
        <p className="text-sm text-muted-foreground">
          Mit E-Mail und Passwort in dein Board.
        </p>
      </div>

      {isAuthConfigured() ? (
        <LoginForm nextPath={nextPath} registered={params.registered === "1"} />
      ) : (
        <ConfigNotice />
      )}

      {isAuthConfigured() ? null : (
        <p className="text-sm text-muted-foreground">
          Du kannst <Link href="/signup">trotzdem registrieren</Link> — auch dort
          erscheint der Hinweis, bis die Zugangsdaten gesetzt sind.
        </p>
      )}
    </div>
  );
}
