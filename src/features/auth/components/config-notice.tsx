import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Sichtbarer Hinweis statt 500er, wenn Supabase-Zugang fehlt oder Platzhalter
 * enthält (AC-9). Es werden nur Variablennamen genannt, nie Werte (SEC-01).
 */
export function ConfigNotice() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" aria-hidden />
      <AlertTitle>Anmeldung nicht eingerichtet</AlertTitle>
      <AlertDescription>
        <p>
          Diesem Start fehlen gültige Supabase-Zugangsdaten. Setze{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> und{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>{" "}
          (Vorlage: <code>.env.local.example</code>) und starte den Server neu.
        </p>
      </AlertDescription>
    </Alert>
  );
}
