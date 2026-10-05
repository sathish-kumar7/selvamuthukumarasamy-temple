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

export interface ExpenseFormValues {
  paidTo: string;
  description: string;
  amount: string;
  categoryId: string;
  paymentMethod: PaymentMethod | "";
  transactionReference: string;
  expenseDate: string;
  notes: string;
}

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: { id: string; name: string }[];
  defaultValues: ExpenseFormValues;
  mode: "create" | "edit";
  cancelHref: string;
}

const METHODS_NEEDING_REFERENCE: PaymentMethod[] = ["UPI", "BANK_TRANSFER", "CHEQUE"];

export function ExpenseForm({ action, categories, defaultValues, mode, cancelHref }: Props) {
  const [state, formAction] = useActionState(action, initialActionState);
  const errors = state.fieldErrors ?? {};
  // After a failed submit React resets uncontrolled inputs, so prefer the echoed values.
  const v = (key: keyof ExpenseFormValues): string => state.values?.[key] ?? defaultValues[key];
  const [method, setMethod] = useState<PaymentMethod | "">(defaultValues.paymentMethod);
  const [amount, setAmount] = useState(defaultValues.amount);
  const parsedAmount = parseAmountInput(amount);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.message && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <Card>
        <CardHeader title="Expense details" description="What was paid, to whom, and for which purpose." />
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Expense date" name="expenseDate" required error={errors.expenseDate}>
            <Input id="expenseDate" name="expenseDate" type="date" defaultValue={v("expenseDate")} required invalid={!!errors.expenseDate} autoFocus={mode === "create"} />
          </Field>
          <Field label="Expense category" name="categoryId" required error={errors.categoryId}>
            <Select id="categoryId" name="categoryId" defaultValue={v("categoryId")} required invalid={!!errors.categoryId}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Paid to" name="paidTo" required error={errors.paidTo} hint="Vendor, shop or person who received the payment">
            <Input id="paidTo" name="paidTo" defaultValue={v("paidTo")} autoComplete="off" required maxLength={120} invalid={!!errors.paidTo} placeholder="e.g. Sri Lakshmi Flower Stall" />
          </Field>
          <Field label="Description" name="description" error={errors.description} hint="Short note on what the money was spent on">
            <Input id="description" name="description" defaultValue={v("description")} autoComplete="off" maxLength={300} invalid={!!errors.description} placeholder="e.g. Flowers and garlands for Friday pooja" />
          </Field>
          <Field
            label="Amount (₹)"
            name="amount"
            required
            error={errors.amount}
            hint={parsedAmount ? <span className="font-medium text-stone-700">{amountInWords(parsedAmount)}</span> : "Enter the amount in rupees, e.g. 1500 or 250.50"}
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
          <Field
            label={method === "CHEQUE" ? "Cheque number" : "Transaction / bill number"}
            name="transactionReference"
            error={errors.transactionReference}
            hint={method && METHODS_NEEDING_REFERENCE.includes(method) ? "Recommended for reconciliation" : "Optional"}
          >
            <Input id="transactionReference" name="transactionReference" defaultValue={v("transactionReference")} autoComplete="off" maxLength={100} invalid={!!errors.transactionReference} />
          </Field>

          <div className="sm:col-span-2">
            <p className="mb-1.5 block text-sm font-medium text-stone-700">
              Paid by <span className="text-red-600" aria-hidden>*</span>
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

          <Field label="Notes" name="notes" error={errors.notes} className="sm:col-span-2" hint="Internal only, e.g. who approved the payment.">
            <Textarea id="notes" name="notes" defaultValue={v("notes")} maxLength={1000} invalid={!!errors.notes} rows={2} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClasses("outline", "lg")}>
          Cancel
        </Link>
        <SubmitButton size="lg" pendingText={mode === "create" ? "Saving expense…" : "Saving changes…"}>
          {mode === "create" ? "Save expense" : "Save changes"}
        </SubmitButton>
      </div>
    </form>
  );
}
