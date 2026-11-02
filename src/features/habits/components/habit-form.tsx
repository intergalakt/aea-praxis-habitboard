import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createHabitAction } from "../habit.actions";

/**
 * AC-1 / AC-10: ein natives Formular, das direkt eine Server Action aufruft.
 * Ohne JavaScript schickt der Browser die Formularfelder als POST — die Seite
 * funktioniert damit auch dann, wenn das Bundle nicht lädt.
 */
export function HabitForm() {
  return (
    <form action={createHabitAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="title">Neue Gewohnheit</Label>
        <Input
          id="title"
          name="title"
          placeholder="z. B. 10 Minuten lesen"
          maxLength={80}
          required
          autoComplete="off"
        />
      </div>
      <Button type="submit">Anlegen</Button>
    </form>
  );
}
