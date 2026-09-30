import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getActiveCategories, getDonationById } from "@/lib/donations/service";
import { utcDateToIso } from "@/lib/dates";
import { updateDonationAction } from "@/actions/donations";
import { PageHeader } from "@/components/ui/page-header";
import { DonationForm } from "@/components/donations/donation-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Edit donation" };

export default async function EditDonationPage(props: PageProps<"/donations/[id]/edit">) {
  const user = await requireUser();
  if (!can(user.role, "donation:edit")) redirect("/dashboard?error=forbidden");

  const { id } = await props.params;
  const [donation, categories] = await Promise.all([getDonationById(id), getActiveCategories()]);
  if (!donation) notFound();
  if (donation.status === "CANCELLED") redirect(`/donations/${donation.id}`);

  // Keep the current category selectable even if it has since been deactivated.
  const categoryOptions = categories.some((c) => c.id === donation.categoryId)
    ? categories
    : [...categories, { id: donation.category.id, name: `${donation.category.name} (inactive)` }];

  const boundAction = updateDonationAction.bind(null, donation.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${donation.receiptNumber}`} description="Changes are recorded in the audit log. The receipt number does not change." />
      <Alert tone="warning" className="mb-6">
        Editing a financial record after the receipt has been issued should be rare. Prefer cancelling and re-entering when the
        amount or donor is wrong.
      </Alert>
      <DonationForm
        mode="edit"
        action={boundAction}
        categories={categoryOptions}
        cancelHref={`/donations/${donation.id}`}
        defaultValues={{
          donorName: donation.donor.name,
          donorMobile: donation.donor.mobile,
          donorEmail: donation.donor.email ?? "",
          donorAddress: donation.donor.address ?? "",
          amount: donation.amount.toString(),
          categoryId: donation.categoryId,
          paymentMethod: donation.paymentMethod,
          transactionReference: donation.transactionReference ?? "",
          donationDate: utcDateToIso(donation.donationDate),
          notes: donation.notes ?? "",
        }}
      />
    </div>
  );
}
