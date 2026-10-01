import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/current-user";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My account" description={`${user.name} · @${user.username}${user.email ? ` · ${user.email}` : ""} · ${user.role === "ADMIN" ? "Administrator" : "Staff"}`} />
      <Card>
        <CardHeader title="Change password" />
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
