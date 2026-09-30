import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "./button";
import { cn } from "@/lib/cn";

interface Props {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageCount, total, pageSize, buildHref }: Props) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-stone-600" aria-label="Pagination">
      <p>
        Showing <span className="font-medium text-stone-900">{start}–{end}</span> of{" "}
        <span className="font-medium text-stone-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(page - 1)}
          aria-disabled={page <= 1}
          className={cn(buttonClasses("outline", "sm"), page <= 1 && "pointer-events-none opacity-50")}
        >
          <ChevronLeft className="size-4" aria-hidden /> Prev
        </Link>
        <span className="px-1">
          Page {page} of {pageCount}
        </span>
        <Link
          href={buildHref(page + 1)}
          aria-disabled={page >= pageCount}
          className={cn(buttonClasses("outline", "sm"), page >= pageCount && "pointer-events-none opacity-50")}
        >
          Next <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
