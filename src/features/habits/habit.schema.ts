import { z } from "zod";

/**
 * Name einer Gewohnheit (AC-1, AC-9, EC-5): getrimmt, 1–80 Zeichen, nicht nur
 * Leerraum. Emoji und Umlaute sind ausdrücklich erlaubt — gezählt wird in
 * Code Points, damit ein Emoji als ein Zeichen gilt und die Grenze nicht
 * mitten in einem Surrogatpaar schneidet.
 */
export const habitTitleSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Bitte gib deiner Gewohnheit einen Namen.")
      .refine((value) => [...value].length <= 80, {
        message: "Der Name darf höchstens 80 Zeichen lang sein.",
      }),
  );

/** IDs kommen aus dem Formular und werden deshalb streng geprüft. */
export const habitIdSchema = z.uuid("Diese Gewohnheit ist unbekannt.");

/** Eingabe der Server Action `createHabit`. */
export const habitInputSchema = z.object({
  title: habitTitleSchema,
});

/** Eingabe der Server Actions `toggleHabit` / `deleteHabit`. */
export const habitTargetSchema = z.object({
  habitId: habitIdSchema,
});

export type HabitInput = z.infer<typeof habitInputSchema>;
export type HabitTarget = z.infer<typeof habitTargetSchema>;
