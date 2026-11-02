import { formatProgress, summarizeToday } from "../habit.rules";
import type { Habit } from "../habit.repository";
import { HabitItem } from "./habit-item";

type Props = { habits: Habit[]; today: string };

/** AC-7: leerer Zustand, AC-5: Fortschritt des Tages. */
export function HabitList({ habits, today }: Props) {
  if (habits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Noch keine Gewohnheiten. Lege oben die erste an — sie erscheint sofort hier.
      </div>
    );
  }

  const progress = summarizeToday(habits, today);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {formatProgress(progress)}
      </p>
      <ul className="space-y-2">
        {habits.map((habit) => (
          <HabitItem key={habit.id} habit={habit} today={today} />
        ))}
      </ul>
    </div>
  );
}
