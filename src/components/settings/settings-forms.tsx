"use client";

import { useActionState, useEffect, useRef } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { createCategoryAction, updateCategoryAction, updateTempleSettingsAction } from "@/actions/settings";
import { initialActionState } from "@/lib/validation/common";
import type { TempleSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

export function TempleSettingsForm({ settings }: { settings: TempleSettings }) {
  const [state, action] = useActionState(updateTempleSettingsAction, initialActionState);
  const errors = state.fieldErrors ?? {};
  const v = (key: keyof TempleSettings, fallback: string): string => state.values?.[key] ?? fallback;
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Temple name (Tamil)" name="templeNameTamil" error={errors.templeNameTamil} className="sm:col-span-2" hint="Printed as the receipt headline. Leave blank to print only the English name.">
          <Input id="templeNameTamil" name="templeNameTamil" defaultValue={v("templeNameTamil", settings.templeNameTamil ?? "")} className="font-tamil" invalid={!!errors.templeNameTamil} />
        </Field>
        <Field label="Temple name (English)" name="templeName" required error={errors.templeName} className="sm:col-span-2">
          <Input id="templeName" name="templeName" defaultValue={v("templeName", settings.templeName)} required invalid={!!errors.templeName} />
        </Field>
        <Field label="Address line 1" name="addressLine1" error={errors.addressLine1}>
          <Input id="addressLine1" name="addressLine1" defaultValue={v("addressLine1", settings.addressLine1 ?? "")} invalid={!!errors.addressLine1} />
        </Field>
        <Field label="Address line 2" name="addressLine2" error={errors.addressLine2}>
          <Input id="addressLine2" name="addressLine2" defaultValue={v("addressLine2", settings.addressLine2 ?? "")} invalid={!!errors.addressLine2} />
        </Field>
        <Field label="Phone" name="phone" error={errors.phone}>
          <Input id="phone" name="phone" type="tel" defaultValue={v("phone", settings.phone ?? "")} invalid={!!errors.phone} />
        </Field>
        <Field label="Email" name="email" error={errors.email}>
          <Input id="email" name="email" type="email" defaultValue={v("email", settings.email ?? "")} invalid={!!errors.email} />
        </Field>
        <Field label="Website" name="website" error={errors.website}>
          <Input id="website" name="website" defaultValue={v("website", settings.website ?? "")} invalid={!!errors.website} placeholder="selvamuthukumarasamy.in" />
        </Field>
        <Field label="Registration number" name="registrationNumber" error={errors.registrationNumber} hint="Trust registration number printed at the top-right of the receipt, e.g. BK4/207/2023.">
          <Input id="registrationNumber" name="registrationNumber" defaultValue={v("registrationNumber", settings.registrationNumber ?? "")} invalid={!!errors.registrationNumber} />
        </Field>
        <Field label="Receipt prefix" name="receiptPrefix" required error={errors.receiptPrefix} hint="Used in new receipt numbers, e.g. SMT-2026-000001. Changing it does not affect existing receipts.">
          <Input id="receiptPrefix" name="receiptPrefix" defaultValue={v("receiptPrefix", settings.receiptPrefix)} required maxLength={6} className="font-mono uppercase" invalid={!!errors.receiptPrefix} />
        </Field>
        <Field label="Thank-you message" name="thankYouMessage" required error={errors.thankYouMessage} className="sm:col-span-2">
          <Textarea id="thankYouMessage" name="thankYouMessage" defaultValue={v("thankYouMessage", settings.thankYouMessage)} rows={3} maxLength={500} invalid={!!errors.thankYouMessage} />
        </Field>
        <Field label="Second signatory label" name="secondarySignatory" error={errors.secondarySignatory} hint="Optional. Printed under the left signature line, e.g. செயலாளர் (Secretary).">
          <Input id="secondarySignatory" name="secondarySignatory" defaultValue={v("secondarySignatory", settings.secondarySignatory ?? "")} className="font-tamil" invalid={!!errors.secondarySignatory} />
        </Field>
        <Field label="Signatory label" name="authorizedSignatory" required error={errors.authorizedSignatory} hint="Printed under the right signature line, e.g. தலைவர் (President).">
          <Input id="authorizedSignatory" name="authorizedSignatory" defaultValue={v("authorizedSignatory", settings.authorizedSignatory)} required className="font-tamil" invalid={!!errors.authorizedSignatory} />
        </Field>
      </div>
      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save temple details</SubmitButton>
      </div>
    </form>
  );
}

export function AddCategoryForm() {
  const [state, action] = useActionState(createCategoryAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
      <div className="flex-1">
        <Input id="name" name="name" defaultValue={state.ok ? "" : (state.values?.name ?? "")} placeholder="New category name, e.g. Kumbabishekam" aria-label="New category name" required maxLength={80} invalid={!!state.fieldErrors?.name} />
        {state.fieldErrors?.name ? <p className="mt-1.5 text-sm text-red-600" role="alert">{state.fieldErrors.name}</p> : null}
        {state.ok && state.message ? <p className="mt-1.5 text-sm text-emerald-700">{state.message}</p> : null}
      </div>
      <SubmitButton pendingText="Adding…">
        <Plus className="size-4" aria-hidden /> Add category
      </SubmitButton>
    </form>
  );
}

export function EditCategoryDialog({ category }: { category: { id: string; name: string; active: boolean } }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(updateCategoryAction, initialActionState);
  useEffect(() => {
    if (state.ok) ref.current?.close();
    else if (state.message || state.fieldErrors) ref.current?.showModal();
  }, [state]);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => ref.current?.showModal()}>
        <Pencil className="size-4" aria-hidden /> Edit
      </Button>
      <dialog ref={ref} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-stone-200 p-0 shadow-2xl backdrop:bg-stone-900/50">
        <form action={action} className="p-6" noValidate>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-stone-900">Edit category</h2>
            <button type="button" onClick={() => ref.current?.close()} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {state.message && !state.ok ? <Alert tone="error" className="mt-4">{state.message}</Alert> : null}
          <input type="hidden" name="categoryId" value={category.id} />
          <div className="mt-5 space-y-4">
            <Field label="Name" name="name" required error={state.fieldErrors?.name}>
              <Input id="name" name="name" defaultValue={state.values?.name ?? category.name} required maxLength={80} invalid={!!state.fieldErrors?.name} />
            </Field>
            <Field label="Status" name="active" hint="Inactive categories are hidden from the donation form but keep their history.">
              <Select id="active" name="active" defaultValue={state.values?.active ?? String(category.active)}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </Field>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => ref.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingText="Saving…">Save</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
