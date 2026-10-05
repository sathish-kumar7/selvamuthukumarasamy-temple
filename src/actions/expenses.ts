"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getRequestIp } from "@/lib/request-ip";
import { cancelExpenseSchema, expenseSchema } from "@/lib/validation/expense";
import { formDataToObject, toFieldErrors, withValues, type ActionState } from "@/lib/validation/common";
import { cancelExpense, createExpense, ExpenseError, updateExpense } from "@/lib/expenses/service";

function handleError(error: unknown): ActionState {
  if (error instanceof ExpenseError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  console.error("Expense action failed", error instanceof Error ? error.message : error);
  return { ok: false, message: "Something went wrong while saving. Please try again." };
}

function revalidateExpenses(expenseId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/expenditures");
  if (expenseId) revalidatePath(`/expenditures/${expenseId}`);
}

export async function createExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "expense:create")) return { ok: false, message: "You are not allowed to add expenses" };

  const parsed = expenseSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return withValues({ ok: false, message: "Please fix the highlighted fields", fieldErrors: toFieldErrors(parsed.error) }, formData);
  }

  let expenseId: string;
  try {
    const expense = await createExpense(parsed.data, { id: user.id, ip: await getRequestIp() });
    expenseId = expense.id;
  } catch (error) {
    return withValues(handleError(error), formData);
  }
  revalidateExpenses();
  redirect(`/expenditures/${expenseId}?created=1`);
}

export async function updateExpenseAction(expenseId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "expense:edit")) return { ok: false, message: "Only administrators can edit expenses" };

  const parsed = expenseSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return withValues({ ok: false, message: "Please fix the highlighted fields", fieldErrors: toFieldErrors(parsed.error) }, formData);
  }
  try {
    await updateExpense(expenseId, parsed.data, { id: user.id, ip: await getRequestIp() });
  } catch (error) {
    return withValues(handleError(error), formData);
  }
  revalidateExpenses(expenseId);
  redirect(`/expenditures/${expenseId}?updated=1`);
}

export async function cancelExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!can(user.role, "expense:cancel")) return { ok: false, message: "Only administrators can cancel expenses" };

  const parsed = cancelExpenseSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return withValues({ ok: false, fieldErrors: toFieldErrors(parsed.error) }, formData);

  try {
    await cancelExpense(parsed.data.expenseId, parsed.data.reason, { id: user.id, ip: await getRequestIp() });
  } catch (error) {
    return handleError(error);
  }
  revalidateExpenses(parsed.data.expenseId);
  redirect(`/expenditures/${parsed.data.expenseId}?cancelled=1`);
}
