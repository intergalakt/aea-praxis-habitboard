import Link from "next/link";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { getSessionUser } from "@/features/auth/auth.hooks";

/**
 * Autoritative Prüfung (AC-8): proxy.ts ist Komfort, hier wird die Identität
 * serverseitig gegen den Auth-Server validiert.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 p-4">
          <nav className="flex items-center gap-4">
            <Link href="/" className="font-semibold tracking-tight">
              HabitBoard
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Board
            </Link>
            <Link
              href="/wetter"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Wetter
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 py-8">{children}</main>
    </div>
  );
}
