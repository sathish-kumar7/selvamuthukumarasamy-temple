import type { Role } from "@/generated/prisma/enums";

export type Permission =
  | "donation:create"
  | "donation:view"
  | "donation:edit"
  | "donation:cancel"
  | "report:view"
  | "user:manage"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    "donation:create",
    "donation:view",
    "donation:edit",
    "donation:cancel",
    "report:view",
    "user:manage",
    "settings:manage",
  ]),
  STAFF: new Set<Permission>(["donation:create", "donation:view", "report:view"]),
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
