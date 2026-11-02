"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/features/auth/auth.hooks";
import { addEntry, create, remove, removeEntry } from "./habit.repository";
import { toIsoDate } from "./habit.rules";
import { habitIdSchema, habitInputSchema } from "./habit.schema";

const BOARD = "/dashboard";

/** Fehlercodes für die Oberfläche — bewusst kurz und ohne interne Details. */
export type HabitErrorCode = "name" | "create" | "toggle" | "remove";

/**
 * Jede Action prüft zuerst die Sitzung (AC-10). Ohne Anmeldung gibt es keinen
 * Nutzer, dem ein Datensatz gehören könnte — die Action leitet zum Login.
 */
async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${BOARD}`);
  return user.id;
}

/** Der Kalendertag kommt vom Server, nie aus dem Formular (AC-9). */
function today(): string {
  return toIsoDate(new Date());
}

/** AC-1: Gewohnheit anlegen. */
export async function createHabitAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const parsed = habitInputSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    redirect(`${BOARD}?fehler=name`);
  }

  const result = await create(userId, parsed.data.title);
  revalidatePath(BOARD);
  redirect(result.ok ? BOARD : `${BOARD}?fehler=create`);
}

/**
 * AC-2: Abhaken und Zurücknehmen in einer Action. Das Feld `done` sagt, was der
 * Nutzer gerade sieht; beide Richtungen sind idempotent (AC-3, EC-3).
 */
export async function toggleHabitAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const parsed = habitIdSchema.safeParse(formData.get("habitId"));
  if (!parsed.success) {
    redirect(`${BOARD}?fehler=toggle`);
  }

  const wasDone = formData.get("done") === "1";
  const result = wasDone
    ? await removeEntry(parsed.data, today())
    : await addEntry(userId, parsed.data, today());

  revalidatePath(BOARD);
  redirect(result.ok ? BOARD : `${BOARD}?fehler=toggle`);
}

/** AC-6: Löschen inklusive Einträgen (Kaskade in der Datenbank). */
export async function deleteHabitAction(formData: FormData): Promise<void> {
  await requireUserId();

  const parsed = habitIdSchema.safeParse(formData.get("habitId"));
  if (!parsed.success) {
    redirect(`${BOARD}?fehler=remove`);
  }

  const result = await remove(parsed.data);
  revalidatePath(BOARD);
  redirect(result.ok ? BOARD : `${BOARD}?fehler=remove`);
}
