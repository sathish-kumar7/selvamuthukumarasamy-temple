import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { formatDateTime, formatDonationDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
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
    select: { id: true, name: true, username: true, email: true, role: true, active: true, createdAt: true, _count: { select: { donationsCreated: true } } },
  });

  return (
    <>
      <PageHeader title="Users" description="Staff accounts that can sign in to record donations." actions={<CreateUserDialog />} />
      {searchParams.created ? <Alert tone="success" className="mb-4">User created.</Alert> : null}
      {searchParams.updated ? <Alert tone="success" className="mb-4">User updated.</Alert> : null}

      <TableWrapper>
        <ul className="divide-y divide-stone-100 md:hidden">
          {users.map((u) => (
            <li key={u.id} className={cn("px-4 py-3", !u.active && "bg-stone-50")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("truncate font-medium", u.active ? "text-stone-900" : "text-stone-400")}>
                    {u.name}
                    {u.id === admin.id ? <span className="ml-2 text-xs font-normal text-stone-500">(you)</span> : null}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    <span className="font-mono">{u.username}</span>
                    {u.email ? ` · ${u.email}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone={u.role === "ADMIN" ? "brand" : "neutral"}>{u.role === "ADMIN" ? "Admin" : "Staff"}</Badge>
                  {u.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-stone-500">
                  {u._count.donationsCreated} donation{u._count.donationsCreated === 1 ? "" : "s"} · added {formatDonationDate(u.createdAt)}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <EditUserDialog user={u} isSelf={u.id === admin.id} />
                  <ResetPasswordDialog user={u} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Table className="hidden md:table">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Username</Th>
              <Th className="hidden lg:table-cell">Email</Th>
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
                </Td>
                <Td className="font-mono text-sm">{u.username}</Td>
                <Td className="hidden lg:table-cell">{u.email ?? <span className="text-stone-400">—</span>}</Td>
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
