import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/current-user";
import { getTempleSettings } from "@/lib/settings";
import { getAllCategories } from "@/lib/donations/service";
import { getAllExpenseCategories } from "@/lib/expenses/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCategoryForm, EditCategoryDialog, TempleSettingsForm } from "@/components/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, categories, expenseCategories] = await Promise.all([getTempleSettings(), getAllCategories(), getAllExpenseCategories()]);

  return (
    <>
      <PageHeader title="Settings" description="Temple details printed on receipts, donation purposes and expense categories." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Temple details" description="Shown in the receipt header, footer and share messages." />
          <CardBody>
            <TempleSettingsForm settings={settings} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Donation categories" description="Purposes staff can choose when recording a donation." />
          <CardBody className="space-y-4">
            <AddCategoryForm />
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {categories.length === 0 ? <li className="px-4 py-6 text-center text-sm text-stone-500">No categories yet.</li> : null}
              {categories.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={c.active ? "font-medium text-stone-900" : "text-stone-400"}>{c.name}</span>
                    {c.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                    <span className="text-xs text-stone-500">
                      {c._count.donations} donation{c._count.donations === 1 ? "" : "s"}
                    </span>
                  </div>
                  <EditCategoryDialog category={{ id: c.id, name: c.name, active: c.active }} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Expense categories" description="Heads under which temple expenses are recorded on the Expenditures page." />
          <CardBody className="space-y-4">
            <AddCategoryForm kind="expense" />
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {expenseCategories.length === 0 ? <li className="px-4 py-6 text-center text-sm text-stone-500">No expense categories yet.</li> : null}
              {expenseCategories.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={c.active ? "font-medium text-stone-900" : "text-stone-400"}>{c.name}</span>
                    {c.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
                    <span className="text-xs text-stone-500">
                      {c._count.expenses} expense{c._count.expenses === 1 ? "" : "s"}
                    </span>
                  </div>
                  <EditCategoryDialog kind="expense" category={{ id: c.id, name: c.name, active: c.active }} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
