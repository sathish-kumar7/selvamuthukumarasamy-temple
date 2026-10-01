"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, initialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <Field label="Username" name="username" required error={errors.username}>
        <Input id="username" name="username" defaultValue={state.values?.username ?? ""} autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus invalid={!!errors.username} placeholder="admin" />
      </Field>
      <Field label="Password" name="password" required error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required invalid={!!errors.password} />
      </Field>
      <SubmitButton size="lg" variant="secondary" className="w-full" pendingText="Signing in…">
        Sign in <ArrowRight className="size-4" aria-hidden />
      </SubmitButton>
    </form>
  );
}
