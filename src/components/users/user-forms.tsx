"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, Pencil, UserPlus, X } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { createUserAction, resetPasswordAction, updateUserAction } from "@/actions/users";
import { initialActionState, PASSWORD_MIN_LENGTH } from "@/lib/validation/common";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

export interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string | null;
  role: Role;
  active: boolean;
}

function RoleSelect({ defaultValue, invalid }: { defaultValue: Role; invalid?: boolean }) {
  return (
    <Select id="role" name="role" defaultValue={defaultValue} invalid={invalid}>
      <option value="STAFF">Staff – add and view donations</option>
      <option value="ADMIN">Admin – full access</option>
    </Select>
  );
}

function DialogFrame({
  dialogRef,
  title,
  description,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <dialog ref={dialogRef} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-stone-200 p-0 shadow-2xl backdrop:bg-stone-900/50">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
            {description ? <p className="mt-1 text-sm text-stone-600">{description}</p> : null}
          </div>
          <button type="button" onClick={() => dialogRef.current?.close()} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" aria-label="Close">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function CreateUserDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(createUserAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if ((state.message || state.fieldErrors) && !state.ok) ref.current?.showModal();
  }, [state]);

  return (
    <>
      <Button onClick={() => ref.current?.showModal()}>
        <UserPlus className="size-4" aria-hidden /> Add user
      </Button>
      <DialogFrame dialogRef={ref} title="Add user" description="The user signs in with this username and password. Ask them to change the password after first sign in.">
        <form action={action} className="mt-5 space-y-4" noValidate autoComplete="off">
          {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}
          <Field label="Full name" name="name" required error={errors.name}>
            <Input id="name" name="name" defaultValue={state.values?.name ?? ""} required invalid={!!errors.name} />
          </Field>
          <Field label="Username" name="username" required error={errors.username} hint="Short login name, e.g. ravi or staff1">
            <Input id="username" name="username" defaultValue={state.values?.username ?? ""} required minLength={3} maxLength={30} autoCapitalize="none" spellCheck={false} invalid={!!errors.username} autoComplete="off" />
          </Field>
          <Field label="Email" name="email" error={errors.email} hint="Optional">
            <Input id="email" name="email" type="email" defaultValue={state.values?.email ?? ""} invalid={!!errors.email} autoComplete="off" />
          </Field>
          <Field label="Role" name="role" required error={errors.role}>
            <RoleSelect defaultValue={(state.values?.role as Role | undefined) ?? "STAFF"} invalid={!!errors.role} />
          </Field>
          <Field label="Temporary password" name="password" required error={errors.password} hint={`At least ${PASSWORD_MIN_LENGTH} characters`}>
            <Input id="password" name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} invalid={!!errors.password} autoComplete="new-password" />
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingText="Creating…">Create user</SubmitButton>
          </div>
        </form>
      </DialogFrame>
    </>
  );
}

export function EditUserDialog({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(updateUserAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if ((state.message || state.fieldErrors) && !state.ok) ref.current?.showModal();
  }, [state]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => ref.current?.showModal()}>
        <Pencil className="size-4" aria-hidden /> Edit
      </Button>
      <DialogFrame dialogRef={ref} title={`Edit ${user.name}`}>
        <form action={action} className="mt-5 space-y-4" noValidate>
          {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}
          <input type="hidden" name="userId" value={user.id} />
          <Field label="Full name" name="name" required error={errors.name}>
            <Input id="name" name="name" defaultValue={state.values?.name ?? user.name} required invalid={!!errors.name} />
          </Field>
          <Field label="Username" name="username" required error={errors.username}>
            <Input id="username" name="username" defaultValue={state.values?.username ?? user.username} required minLength={3} maxLength={30} autoCapitalize="none" spellCheck={false} invalid={!!errors.username} />
          </Field>
          <Field label="Email" name="email" error={errors.email} hint="Optional">
            <Input id="email" name="email" type="email" defaultValue={state.values?.email ?? user.email ?? ""} invalid={!!errors.email} />
          </Field>
          <Field label="Role" name="role" required error={errors.role} hint={isSelf ? "You cannot change your own role." : undefined}>
            <Select id="role" name="role" defaultValue={state.values?.role ?? user.role} disabled={isSelf} invalid={!!errors.role}>
              <option value="STAFF">Staff – add and view donations</option>
              <option value="ADMIN">Admin – full access</option>
            </Select>
            {isSelf ? <input type="hidden" name="role" value={user.role} /> : null}
          </Field>
          <Field label="Status" name="active" required error={errors.active} hint={isSelf ? "You cannot deactivate your own account." : "Deactivated users cannot sign in but their history is kept."}>
            <Select id="active" name="active" defaultValue={state.values?.active ?? String(user.active)} disabled={isSelf}>
              <option value="true">Active</option>
              <option value="false">Deactivated</option>
            </Select>
            {isSelf ? <input type="hidden" name="active" value="true" /> : null}
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
          </div>
        </form>
      </DialogFrame>
    </>
  );
}

export function ResetPasswordDialog({ user }: { user: UserRow }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(resetPasswordAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) ref.current?.close();
    else if (state.message || state.fieldErrors) ref.current?.showModal();
  }, [state]);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => ref.current?.showModal()}>
        <KeyRound className="size-4" aria-hidden /> Reset password
      </Button>
      {state.ok ? <span className="text-xs text-emerald-700">{state.message}</span> : null}
      <DialogFrame dialogRef={ref} title={`Reset password for ${user.name}`} description="Share the new password with the user securely and ask them to change it after signing in.">
        <form action={action} className="mt-5 space-y-4" noValidate>
          {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}
          <input type="hidden" name="userId" value={user.id} />
          <Field label="New password" name="password" required error={errors.password} hint={`At least ${PASSWORD_MIN_LENGTH} characters`}>
            <Input id="password" name="password" type="password" required minLength={PASSWORD_MIN_LENGTH} invalid={!!errors.password} autoComplete="new-password" />
          </Field>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingText="Resetting…">Reset password</SubmitButton>
          </div>
        </form>
      </DialogFrame>
    </>
  );
}
