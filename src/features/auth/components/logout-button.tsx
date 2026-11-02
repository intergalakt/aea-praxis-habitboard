import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import { signOutAction } from "../auth.actions";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut className="mr-2 h-4 w-4" aria-hidden />
        Abmelden
      </Button>
    </form>
  );
}
