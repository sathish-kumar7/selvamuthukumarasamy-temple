"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { navItemsForRole } from "./nav-items";
import { TempleMark } from "./temple-mark";
import { logoutAction } from "@/actions/auth";

interface Props {
  user: { name: string; role: Role };
  templeName: string;
  children: React.ReactNode;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/donations") return pathname === "/donations" || (pathname.startsWith("/donations/") && !pathname.startsWith("/donations/new"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ user, templeName, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItemsForRole(user.role);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active ? "bg-saffron-100 text-saffron-900" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            )}
          >
            <item.icon className={cn("size-5", active ? "text-saffron-700" : "text-stone-400")} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const userBlock = (
    <div className="border-t border-stone-200 px-3 py-3">
      <Link
        href="/account"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-stone-100"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-maroon-100 text-maroon-800">
          <UserRound className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-stone-900">{user.name}</span>
          <span className="block text-xs text-stone-500">{user.role === "ADMIN" ? "Administrator" : "Staff"}</span>
        </span>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="mt-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          <LogOut className="size-4 text-stone-400" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );

  return (
    // The shell fills the viewport and only the content column scrolls, so the
    // sidebar stays put. Print restores normal flow so receipts are not clipped.
    <div className="flex h-dvh overflow-hidden print:h-auto print:overflow-visible">
      {/* Desktop sidebar: fixed to the viewport; scrolls internally only if the window is very short. */}
      <aside className="print-hidden hidden h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-stone-200 bg-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <TempleMark className="size-10 text-saffron-700" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{templeName}</p>
            <p className="text-xs text-stone-500">Donation Management</p>
          </div>
        </div>
        {nav}
        {userBlock}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-stone-900/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <TempleMark className="size-9 text-saffron-700" />
                <p className="text-sm font-semibold text-stone-900">Menu</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-stone-100" aria-label="Close menu">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {nav}
            {userBlock}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto print:overflow-visible">
        {/* Mobile top bar (sticky within the scrolling column) */}
        <header className="print-hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 hover:bg-stone-100" aria-label="Open menu">
            <Menu className="size-6" aria-hidden />
          </button>
          <TempleMark className="size-8 text-saffron-700" />
          <p className="truncate text-sm font-semibold text-stone-900">{templeName}</p>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
