import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { CreateUserDialog, EditUserDialog, ResetPasswordDialog } from "@/components/users/user-forms";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage(props: PageProps<"/users">) {
  const [admin, searchParams] = await Promise.all([requireAdmin(), props.searchParams]);
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, _count: { select: { donationsCreated: true } } },
  });

  return (
    <>
      <PageHeader title="Users" description="Staff accounts that can sign in to record donations." actions={<CreateUserDialog />} />
      {searchParams.created ? <Alert tone="success" className="mb-4">User created.</Alert> : null}
      {searchParams.updated ? <Alert tone="success" className="mb-4">User updated.</Alert> : null}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th className="hidden sm:table-cell">Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="hidden text-right md:table-cell">Donations</Th>
              <Th className="hidden lg:table-cell">Added</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className={u.active ? undefined : "bg-stone-50 text-stone-400"}>
                <Td>
                  <span className="font-medium text-stone-900">{u.name}</span>
                  {u.id === admin.id ? <span className="ml-2 text-xs text-stone-500">(you)</span> : null}
                  <span className="block text-xs text-stone-500 sm:hidden">{u.email}</span>
                </Td>
                <Td className="hidden sm:table-cell">{u.email}</Td>
                <Td>
                  <Badge tone={u.role === "ADMIN" ? "brand" : "neutral"}>{u.role === "ADMIN" ? "Admin" : "Staff"}</Badge>
                </Td>
                <Td>{u.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}</Td>
                <Td className="hidden text-right tabular-nums md:table-cell">{u._count.donationsCreated}</Td>
                <Td className="hidden whitespace-nowrap text-stone-500 lg:table-cell">{formatDateTime(u.createdAt)}</Td>
                <Td>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <EditUserDialog user={u} isSelf={u.id === admin.id} />
                    <ResetPasswordDialog user={u} />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>
    </>
  );
}
