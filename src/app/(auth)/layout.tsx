import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            HabitBoard
          </Link>
          <p className="text-sm text-muted-foreground">
            Kleine Schritte, sichtbar gemacht.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">{children}</CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          <Link className="underline underline-offset-4" href="/">
            Zurück zur Startseite
          </Link>
        </p>
      </div>
    </div>
  );
}
