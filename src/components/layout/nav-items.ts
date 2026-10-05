import type { Role } from "@/generated/prisma/enums";
import { BarChart3, LayoutDashboard, PlusCircle, ReceiptText, Settings, Users, Wallet } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donations/new", label: "Add Donation", icon: PlusCircle },
  { href: "/donations", label: "Donations", icon: ReceiptText },
  { href: "/expenditures", label: "Expenditures", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
