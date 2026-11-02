import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 p-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">HabitBoard</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Gewohnheiten, die bleiben.
        </h1>
        <p className="text-lg text-muted-foreground">
          Täglich abhaken, Serie sehen, dranbleiben. Ohne Konto-Wirrwarr, ohne
          Spielerei.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/signup" className={buttonVariants()}>
          Konto anlegen
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Anmelden
        </Link>
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
          Zum Board
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Das Board ist nur mit Anmeldung erreichbar — ohne Session leitet es zur
        Anmeldung.
      </p>
    </main>
  );
}
