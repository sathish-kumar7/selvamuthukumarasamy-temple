import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getActiveExpenseCategories, getExpenseById } from "@/lib/expenses/service";
import { utcDateToIso } from "@/lib/dates";
import { updateExpenseAction } from "@/actions/expenses";
import { PageHeader } from "@/components/ui/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const metadata: Metadata = { title: "Edit expense" };

export default async function EditExpensePage(props: PageProps<"/expenditures/[id]/edit">) {
  const user = await requireUser();
  if (!can(user.role, "expense:edit")) redirect("/dashboard?error=forbidden");

  const { id } = await props.params;
  const [expense, categories] = await Promise.all([getExpenseById(id), getActiveExpenseCategories()]);
  if (!expense) notFound();
  if (expense.status === "CANCELLED") redirect(`/expenditures/${expense.id}`);

  // Keep the current category selectable even if it has since been deactivated.
  const categoryOptions = categories.some((c) => c.id === expense.categoryId)
    ? categories
    : [...categories, { id: expense.category.id, name: `${expense.category.name} (inactive)` }];

  const boundAction = updateExpenseAction.bind(null, expense.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${expense.voucherNumber}`} description="Changes are recorded in the audit log. The voucher number does not change." />
      <ExpenseForm
        mode="edit"
        action={boundAction}
        categories={categoryOptions}
        cancelHref={`/expenditures/${expense.id}`}
        defaultValues={{
          paidTo: expense.paidTo,
          description: expense.description ?? "",
          amount: expense.amount.toString(),
          categoryId: expense.categoryId,
          paymentMethod: expense.paymentMethod,
          transactionReference: expense.transactionReference ?? "",
          expenseDate: utcDateToIso(expense.expenseDate),
          notes: expense.notes ?? "",
        }}
      />
    </div>
  );
}
