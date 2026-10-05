import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { getActiveExpenseCategories } from "@/lib/expenses/service";
import { todayIsoDate } from "@/lib/dates";
import { createExpenseAction } from "@/actions/expenses";
import { PageHeader } from "@/components/ui/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Add expense" };

export default async function NewExpensePage() {
  await requireUser();
  const categories = await getActiveExpenseCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add expense" description="Record a payment made by the temple. A voucher number is assigned automatically." />
      {categories.length === 0 ? (
        <Alert tone="warning" className="mb-6" title="No expense categories configured">
          An administrator must add at least one expense category in Settings before expenses can be recorded.
        </Alert>
      ) : null}
      <ExpenseForm
        mode="create"
        action={createExpenseAction}
        categories={categories}
        cancelHref="/expenditures"
        defaultValues={{
          paidTo: "",
          description: "",
          amount: "",
          categoryId: categories.length === 1 ? categories[0].id : "",
          paymentMethod: "CASH",
          transactionReference: "",
          expenseDate: todayIsoDate(),
          notes: "",
        }}
      />
    </div>
  );
}
