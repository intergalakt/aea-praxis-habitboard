import { Button } from "@/components/ui/button";

import { deleteHabitAction, toggleHabitAction } from "../habit.actions";
import { calculateStreak, formatStreak } from "../habit.rules";
import type { Habit } from "../habit.repository";

type Props = { habit: Habit; today: string };

/**
 * Eine Zeile pro Gewohnheit: Abhaken (AC-2), Serie (AC-4) und Löschen (AC-6).
 * Abhaken und Löschen sind getrennte Formulare — verschachtelte Formulare sind
 * in HTML nicht erlaubt.
 */
export function HabitItem({ habit, today }: Props) {
  const done = habit.entryDates.includes(today);
  const streak = calculateStreak(habit.entryDates, today);

  return (
    <li className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium">{habit.title}</p>
        <p className="text-xs text-muted-foreground">
          {done ? "Heute erledigt" : "Heute offen"} · {formatStreak(streak)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <form action={toggleHabitAction}>
          <input type="hidden" name="habitId" value={habit.id} />
          <input type="hidden" name="done" value={done ? "1" : "0"} />
          <Button type="submit" variant={done ? "secondary" : "default"} size="sm">
            {done ? "Zurücknehmen" : "Abhaken"}
          </Button>
        </form>

        <form action={deleteHabitAction}>
          <input type="hidden" name="habitId" value={habit.id} />
          <Button type="submit" variant="ghost" size="sm" aria-label={`${habit.title} löschen`}>
            Löschen
          </Button>
        </form>
      </div>
    </li>
  );
}
