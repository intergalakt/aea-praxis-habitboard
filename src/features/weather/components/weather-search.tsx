import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Suchformular als normales GET-Formular: die Seite bleibt eine Server Component,
 * der Ort steht in der URL (teilbar, ohne Client-State, AC-2). `noValidate` überlässt
 * die Prüfung dem Server (AC-9), damit auch ein leerer Wert einen deutschen Hinweis bekommt.
 */
export function WeatherSearch({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/wetter" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="ort">Ort</Label>
        <Input
          id="ort"
          name="ort"
          type="search"
          placeholder="z. B. Freiburg"
          maxLength={80}
          defaultValue={defaultValue}
          autoComplete="off"
          required
        />
      </div>
      <Button type="submit" className="sm:w-auto">
        Wetter anzeigen
      </Button>
    </form>
  );
}
