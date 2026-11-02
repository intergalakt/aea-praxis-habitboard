import type { Metadata } from "next";

import { getSessionUser } from "@/features/auth/auth.hooks";

export const metadata: Metadata = {
  title: "Board · HabitBoard",
};

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dein Board</h1>
        <p className="text-sm text-muted-foreground">
          Angemeldet als {user?.email ?? "unbekannt"}.
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Gewohnheiten und Wochenübersicht kommen mit HAB-3.
      </div>
    </div>
  );
}
