"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getRequestIp } from "@/lib/request-ip";
import { cancelDonationSchema, donationSchema } from "@/lib/validation/donation";
import { formDataToObject, toFieldErrors, type ActionState } from "@/lib/validation/common";
import { cancelDonation, createDonation, DonationError, updateDonation } from "@/lib/donations/service";

function handleError(error: unknown): ActionState {
  if (error instanceof DonationError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  console.error("Donation action failed", error instanceof Error ? error.message : error);
  return { ok: false, message: "Something went wrong while saving. Please try again." };
}

export async function createDonationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "donation:create")) return { ok: false, message: "You are not allowed to add donations" };

  const parsed = donationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields", fieldErrors: toFieldErrors(parsed.error) };
  }

  let donationId: string;
  try {
    const donation = await createDonation(parsed.data, { id: user.id, ip: await getRequestIp() });
    donationId = donation.id;
  } catch (error) {
    return handleError(error);
  }
  revalidatePath("/dashboard");
  revalidatePath("/donations");
  redirect(`/donations/${donationId}?created=1`);
}

export async function updateDonationAction(donationId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "donation:edit")) return { ok: false, message: "Only administrators can edit donations" };

  const parsed = donationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields", fieldErrors: toFieldErrors(parsed.error) };
  }
  try {
    await updateDonation(donationId, parsed.data, { id: user.id, ip: await getRequestIp() });
  } catch (error) {
    return handleError(error);
  }
  revalidatePath("/dashboard");
  revalidatePath("/donations");
  revalidatePath(`/donations/${donationId}`);
  redirect(`/donations/${donationId}?updated=1`);
}

export async function cancelDonationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "donation:cancel")) return { ok: false, message: "Only administrators can cancel donations" };

  const parsed = cancelDonationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, fieldErrors: toFieldErrors(parsed.error) };

  try {
    await cancelDonation(parsed.data.donationId, parsed.data.reason, { id: user.id, ip: await getRequestIp() });
  } catch (error) {
    return handleError(error);
  }
  revalidatePath("/dashboard");
  revalidatePath("/donations");
  revalidatePath(`/donations/${parsed.data.donationId}`);
  redirect(`/donations/${parsed.data.donationId}?cancelled=1`);
}
