"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeOwnPasswordAction } from "@/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changeOwnPasswordAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <Field label="Current password" name="currentPassword" required error={errors.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required invalid={!!errors.currentPassword} />
      </Field>
      <Field label="New password" name="newPassword" required error={errors.newPassword} hint="At least 10 characters">
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={10} invalid={!!errors.newPassword} />
      </Field>
      <Field label="Confirm new password" name="confirmPassword" required error={errors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required invalid={!!errors.confirmPassword} />
      </Field>
      <div className="flex justify-end">
        <SubmitButton pendingText="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}
