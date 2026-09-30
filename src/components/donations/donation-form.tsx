"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { PaymentMethod } from "@/generated/prisma/enums";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { amountInWords } from "@/lib/amount-in-words";
import { parseAmountInput } from "@/lib/money";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface DonationFormValues {
  donorName: string;
  donorMobile: string;
  donorEmail: string;
  donorAddress: string;
  amount: string;
  categoryId: string;
  paymentMethod: PaymentMethod | "";
  transactionReference: string;
  donationDate: string;
  notes: string;
}

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: { id: string; name: string }[];
  defaultValues: DonationFormValues;
  mode: "create" | "edit";
  cancelHref: string;
}

const METHODS_NEEDING_REFERENCE: PaymentMethod[] = ["UPI", "BANK_TRANSFER", "CHEQUE"];

export function DonationForm({ action, categories, defaultValues, mode, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialActionState);
  const errors = state.fieldErrors ?? {};
  const [method, setMethod] = useState<PaymentMethod | "">(defaultValues.paymentMethod);
  const [amount, setAmount] = useState(defaultValues.amount);
  const parsedAmount = parseAmountInput(amount);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <Card>
        <CardHeader title="Donor details" description="Search by mobile number is available on the Donations page." />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Donor name" name="donorName" required error={errors.donorName}>
            <Input id="donorName" name="donorName" defaultValue={defaultValues.donorName} autoComplete="off" autoFocus={mode === "create"} required maxLength={120} invalid={!!errors.donorName} />
          </Field>
          <Field label="Mobile number" name="donorMobile" required error={errors.donorMobile} hint="10-digit Indian mobile number">
            <Input id="donorMobile" name="donorMobile" type="tel" inputMode="numeric" defaultValue={defaultValues.donorMobile} autoComplete="off" required maxLength={15} invalid={!!errors.donorMobile} placeholder="98765 43210" />
          </Field>
          <Field label="Email" name="donorEmail" error={errors.donorEmail}>
            <Input id="donorEmail" name="donorEmail" type="email" inputMode="email" defaultValue={defaultValues.donorEmail} autoComplete="off" invalid={!!errors.donorEmail} />
          </Field>
          <Field label="Address" name="donorAddress" error={errors.donorAddress}>
            <Input id="donorAddress" name="donorAddress" defaultValue={defaultValues.donorAddress} autoComplete="off" maxLength={500} invalid={!!errors.donorAddress} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Donation details" />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Amount (₹)"
            name="amount"
            required
            error={errors.amount}
            hint={parsedAmount ? <span className="font-medium text-stone-700">{amountInWords(parsedAmount)}</span> : "Enter the amount in rupees, e.g. 1001 or 501.50"}
          >
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-lg font-semibold"
              invalid={!!errors.amount}
              placeholder="0.00"
            />
          </Field>
          <Field label="Donation purpose" name="categoryId" required error={errors.categoryId}>
            <Select id="categoryId" name="categoryId" defaultValue={defaultValues.categoryId} required invalid={!!errors.categoryId}>
              <option value="">Select purpose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-1.5 block text-sm font-medium text-stone-700">
              Payment method <span className="text-red-600" aria-hidden>*</span>
            </p>
            <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(PaymentMethod) as PaymentMethod[]).map((m) => {
                const selected = method === m;
                return (
                  <label
                    key={m}
                    className={cn(
                      "flex h-12 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                      selected ? "border-saffron-600 bg-saffron-50 text-saffron-900 ring-2 ring-saffron-500/40" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
                    )}
                  >
                    <input type="radio" name="paymentMethod" value={m} checked={selected} onChange={() => setMethod(m)} className="sr-only" />
                    {PAYMENT_METHOD_LABELS[m]}
                  </label>
                );
              })}
            </div>
            {errors.paymentMethod ? <p className="mt-1.5 text-sm text-red-600" role="alert">{errors.paymentMethod}</p> : null}
          </div>

          <Field
            label={method === "CHEQUE" ? "Cheque number" : "Transaction / reference number"}
            name="transactionReference"
            error={errors.transactionReference}
            hint={method && METHODS_NEEDING_REFERENCE.includes(method) ? "Recommended for reconciliation" : "Optional"}
          >
            <Input id="transactionReference" name="transactionReference" defaultValue={defaultValues.transactionReference} autoComplete="off" maxLength={100} invalid={!!errors.transactionReference} />
          </Field>
          <Field label="Donation date" name="donationDate" required error={errors.donationDate}>
            <Input id="donationDate" name="donationDate" type="date" defaultValue={defaultValues.donationDate} required invalid={!!errors.donationDate} />
          </Field>
          <Field label="Notes" name="notes" error={errors.notes} className="sm:col-span-2" hint="Internal only. Not printed on the receipt.">
            <Textarea id="notes" name="notes" defaultValue={defaultValues.notes} maxLength={1000} invalid={!!errors.notes} rows={2} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClasses("outline", "lg")}>
          Cancel
        </Link>
        <SubmitButton size="lg" pendingText={mode === "create" ? "Saving donation…" : "Saving changes…"}>
          {mode === "create" ? "Save & generate receipt" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
