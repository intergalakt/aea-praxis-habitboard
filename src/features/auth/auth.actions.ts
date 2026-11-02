"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient, isAuthConfigured } from "./auth.hooks";
import {
  mapAuthError,
  safeNextPath,
  TEMPORARY_FAILURE_MESSAGE,
} from "./auth.rules";
import { fieldErrorsOf, signInSchema, signUpSchema } from "./auth.schema";
import type { AuthFormState } from "./auth.state";
import {
  checkAttempt,
  clearFailures,
  recordFailure,
  throttleKey,
} from "./auth.throttle";

const NOT_CONFIGURED =
  "Anmeldung ist nicht konfiguriert. Bitte wende dich an den Betreiber.";

async function clientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip") ?? "lokal";
}

function tooManyAttemptsMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Zu viele Fehlversuche. Bitte in ${minutes} Minuten erneut versuchen.`;
}

/** Registrierung: neutrale Antwort, egal ob die Adresse neu war (AC-2). */
export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bitte korrigiere die markierten Felder.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  if (!isAuthConfigured()) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const key = throttleKey(parsed.data.email, await clientIp());
  const gate = checkAttempt(key);
  if (!gate.allowed) {
    return { status: "error", message: tooManyAttemptsMessage(gate.retryAfterSeconds) };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Lokal (ohne E-Mail-Bestätigung) liefert GoTrue direkt eine Session. Wir
  // verwerfen sie bewusst: Nach der Registrierung soll die Anmeldung explizit
  // erfolgen (AC-1), und derselbe Pfad bleibt gültig, sobald Bestätigungsmails
  // aktiv sind.
  if (!error) {
    await supabase.auth.signOut();
  }

  if (error) {
    const mapped = mapAuthError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
    // "Bereits vorhanden" liefert eine leere Zuordnung: gleiche neutrale Antwort.
    if (mapped) {
      recordFailure(key);
      return { status: "error", message: mapped };
    }
  }

  redirect("/login?registered=1");
}

/** Anmeldung: Drosselung, Validierung, offener Redirect verhindert (AC-3, AC-4, EC-2). */
export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const nextPath = safeNextPath(formData.get("next") as string | null);

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Bitte korrigiere die markierten Felder.",
      fieldErrors: fieldErrorsOf(parsed.error),
    };
  }

  if (!isAuthConfigured()) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const key = throttleKey(parsed.data.email, await clientIp());
  const gate = checkAttempt(key);
  if (!gate.allowed) {
    return { status: "error", message: tooManyAttemptsMessage(gate.retryAfterSeconds) };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { status: "error", message: NOT_CONFIGURED };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    recordFailure(key);
    return {
      status: "error",
      message:
        mapAuthError({
          code: error.code,
          message: error.message,
          status: error.status,
        }) || TEMPORARY_FAILURE_MESSAGE,
    };
  }

  clearFailures(key);
  redirect(nextPath);
}

/** Abmelden: Session serverseitig beenden, Cookie wird von Supabase gelöscht (AC-7). */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/");
}
