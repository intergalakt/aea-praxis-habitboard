import type { Metadata } from "next";

import { ConfigNotice } from "@/features/auth/components/config-notice";
import { SignupForm } from "@/features/auth/components/signup-form";
import { isAuthConfigured } from "@/features/auth/auth.rules";

export const metadata: Metadata = {
  title: "Konto anlegen · HabitBoard",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Konto anlegen</h1>
        <p className="text-sm text-muted-foreground">
          Ein Konto, alle Geräte — deine Gewohnheiten bleiben zusammen.
        </p>
      </div>

      {isAuthConfigured() ? <SignupForm /> : <ConfigNotice />}
    </div>
  );
}
