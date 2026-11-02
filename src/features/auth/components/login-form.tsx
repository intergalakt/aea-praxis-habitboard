"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signInAction } from "../auth.actions";
import { initialAuthState } from "../auth.state";

type LoginFormProps = {
  nextPath: string;
  registered?: boolean;
};

export function LoginForm({ nextPath, registered = false }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialAuthState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      {registered ? (
        <Alert>
          <AlertDescription>
            Konto angelegt. Du kannst dich jetzt anmelden. Falls dein Projekt
            E-Mail-Bestätigung verlangt, bestätige zuerst den Link in deiner Mail.
          </AlertDescription>
        </Alert>
      ) : null}

      {state.status === "error" && state.message ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          defaultValue=""
        />
        {state.fieldErrors?.email ? (
          <p id="email-error" className="text-sm text-destructive">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          defaultValue=""
        />
        {state.fieldErrors?.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Anmelden …" : "Anmelden"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link className="underline underline-offset-4" href="/signup">
          Registrieren
        </Link>
      </p>
    </form>
  );
}
