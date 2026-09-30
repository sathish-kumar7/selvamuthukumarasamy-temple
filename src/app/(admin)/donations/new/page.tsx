import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { getActiveCategories } from "@/lib/donations/service";
import { todayIsoDate } from "@/lib/dates";
import { createDonationAction } from "@/actions/donations";
import { PageHeader } from "@/components/ui/page-header";
import { DonationForm } from "@/components/donations/donation-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Add donation" };

export default async function NewDonationPage() {
  await requireUser();
  const categories = await getActiveCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add donation" description="Record a donation and generate the receipt in one step." />
      {categories.length === 0 ? (
        <Alert tone="warning" className="mb-6" title="No donation purposes configured">
          An administrator must add at least one donation category in Settings before donations can be recorded.
        </Alert>
      ) : null}
      <DonationForm
        mode="create"
        action={createDonationAction}
        categories={categories}
        cancelHref="/dashboard"
        defaultValues={{
          donorName: "",
          donorMobile: "",
          donorEmail: "",
          donorAddress: "",
          amount: "",
          categoryId: categories.length === 1 ? categories[0].id : "",
          paymentMethod: "CASH",
          transactionReference: "",
          donationDate: todayIsoDate(),
          notes: "",
        }}
      />
    </div>
  );
}
