/** Formularzustand für useActionState — getrennt von den Actions ("use server"). */
export type AuthFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialAuthState: AuthFormState = { status: "idle" };
