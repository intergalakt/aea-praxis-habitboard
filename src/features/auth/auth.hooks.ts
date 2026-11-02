import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isAuthConfigured } from "./auth.rules";

export { isAuthConfigured };

/**
 * Server-Client mit Cookie-Brücke. Gibt null zurück, wenn die Umgebung nicht
 * konfiguriert ist — Aufrufer entscheiden dann sichtbar statt zu crashen (AC-9).
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isAuthConfigured()) return null;

  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // In Server Components sind Cookies read-only; die Aktualisierung
            // übernimmt proxy.ts. Kein Grund, das Rendering abzubrechen.
          }
        },
      },
    },
  );
}

/** Autoritative Identitätsprüfung (AC-8): getUser() validiert beim Auth-Server. */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
});
