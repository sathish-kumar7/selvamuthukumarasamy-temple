"use client";

import { useActionState, useEffect, useRef } from "react";
import { Ban, X } from "lucide-react";
import { cancelDonationAction } from "@/actions/donations";
import { initialActionState } from "@/lib/validation/common";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";

interface Props {
  donationId: string;
  receiptNumber: string;
  amountLabel: string;
  donorName: string;
}

export function CancelDonationDialog({ donationId, receiptNumber, amountLabel, donorName }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action] = useActionState(cancelDonationAction, initialActionState);

  useEffect(() => {
    if (state.message && !state.ok) dialogRef.current?.showModal();
  }, [state]);

  return (
    <>
      <Button variant="danger" onClick={() => dialogRef.current?.showModal()}>
        <Ban className="size-4" aria-hidden /> Cancel receipt
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-stone-200 p-0 shadow-2xl backdrop:bg-stone-900/50"
        aria-labelledby="cancel-title"
      >
        <form action={action} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="cancel-title" className="text-lg font-semibold text-stone-900">
                Cancel receipt {receiptNumber}?
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                {amountLabel} from <span className="font-medium">{donorName}</span> will be marked cancelled and excluded from all
                totals. The record stays in the system for audit purposes and cannot be un-cancelled.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {state.message && !state.ok ? (
            <Alert tone="error" className="mt-4">
              {state.message}
            </Alert>
          ) : null}

          <input type="hidden" name="donationId" value={donationId} />
          <div className="mt-5">
            <Field label="Reason for cancellation" name="reason" required error={state.fieldErrors?.reason}>
              <Textarea id="reason" name="reason" required minLength={5} maxLength={500} rows={3} placeholder="e.g. Duplicate entry, wrong amount entered, donor requested refund" invalid={!!state.fieldErrors?.reason} />
            </Field>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => dialogRef.current?.close()}>
              Keep receipt
            </Button>
            <SubmitButton variant="danger" pendingText="Cancelling…">
              Yes, cancel this receipt
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
