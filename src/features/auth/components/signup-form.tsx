"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signUpAction } from "../auth.actions";
import { initialAuthState } from "../auth.state";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialAuthState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
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
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : "password-hint"
          }
          defaultValue=""
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Mindestens 10 Zeichen, mit Groß- und Kleinbuchstaben und einer Ziffer.
        </p>
        {state.fieldErrors?.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Konto anlegen …" : "Konto anlegen"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Schon dabei?{" "}
        <Link className="underline underline-offset-4" href="/login">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
