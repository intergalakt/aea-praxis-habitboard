import "server-only";

import { createSupabaseServerClient } from "@/features/auth/auth.hooks";
import { addDays } from "./habit.rules";

/** Fehlertexte an einer Stelle, damit Oberfläche und Tests dieselben Strings sehen. */
export const HABIT_MESSAGES = {
  load: "Gewohnheiten konnten nicht geladen werden.",
  create: "Die Gewohnheit konnte nicht angelegt werden.",
  toggle: "Der Eintrag konnte nicht gespeichert werden.",
  remove: "Die Gewohnheit konnte nicht gelöscht werden.",
  notConfigured: "Die Datenbank ist nicht konfiguriert. Bitte wende dich an den Betreiber.",
} as const;

/** So lange werden Einträge für die Serienberechnung geladen (MVP: ein Jahr reicht). */
const STREAK_WINDOW_DAYS = 365;

export type Habit = {
  id: string;
  title: string;
  createdAt: string;
  entryDates: string[];
};

export type HabitsResult =
  | { ok: true; habits: Habit[] }
  | { ok: false; message: string };

export type MutationResult = { ok: true } | { ok: false; message: string };

type EntryRow = { habit_id: string; entry_date: string };

async function client() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error(HABIT_MESSAGES.notConfigured);
  return supabase;
}

/**
 * Lädt die Gewohnheiten des angemeldeten Nutzers samt der Einträge eines Jahres.
 * Welche Zeilen ankommen, entscheidet RLS (AC-8) — hier wird nicht gefiltert.
 */
export async function listForUser(today: string): Promise<HabitsResult> {
  try {
    const supabase = await client();

    const { data: habits, error } = await supabase
      .from("habits")
      .select("id, title, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const { data: entries, error: entryError } = await supabase
      .from("habit_entries")
      .select("habit_id, entry_date")
      .gte("entry_date", addDays(today, -STREAK_WINDOW_DAYS));

    if (entryError) throw entryError;

    const byHabit = new Map<string, string[]>();
    for (const entry of (entries ?? []) as EntryRow[]) {
      const list = byHabit.get(entry.habit_id) ?? [];
      list.push(entry.entry_date);
      byHabit.set(entry.habit_id, list);
    }

    return {
      ok: true,
      habits: (habits ?? []).map((habit) => ({
        id: habit.id as string,
        title: habit.title as string,
        createdAt: habit.created_at as string,
        entryDates: byHabit.get(habit.id as string) ?? [],
      })),
    };
  } catch {
    return { ok: false, message: HABIT_MESSAGES.load };
  }
}

/** Legt eine Gewohnheit an; `user_id` kommt aus der Session, nie aus dem Formular. */
export async function create(userId: string, title: string): Promise<MutationResult> {
  try {
    const supabase = await client();
    const { error } = await supabase.from("habits").insert({ user_id: userId, title });
    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, message: HABIT_MESSAGES.create };
  }
}

/**
 * Hakt einen Tag ab. Upsert auf `(habit_id, entry_date)` mit `ignoreDuplicates`
 * macht Doppelklicks und zwei Tabs zum No-Op statt zum Fehler (AC-3, EC-3).
 */
export async function addEntry(
  userId: string,
  habitId: string,
  entryDate: string,
): Promise<MutationResult> {
  try {
    const supabase = await client();
    const { error } = await supabase
      .from("habit_entries")
      .upsert(
        { habit_id: habitId, user_id: userId, entry_date: entryDate },
        { onConflict: "habit_id,entry_date", ignoreDuplicates: true },
      );
    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, message: HABIT_MESSAGES.toggle };
  }
}

/** Nimmt das Abhaken zurück — idempotent, ein zweiter Aufruf ändert nichts. */
export async function removeEntry(habitId: string, entryDate: string): Promise<MutationResult> {
  try {
    const supabase = await client();
    const { error } = await supabase
      .from("habit_entries")
      .delete()
      .eq("habit_id", habitId)
      .eq("entry_date", entryDate);
    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, message: HABIT_MESSAGES.toggle };
  }
}

/** Löscht eine Gewohnheit; die Einträge räumt `ON DELETE CASCADE` (AC-6). */
export async function remove(habitId: string): Promise<MutationResult> {
  try {
    const supabase = await client();
    const { error } = await supabase.from("habits").delete().eq("id", habitId);
    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, message: HABIT_MESSAGES.remove };
  }
}
