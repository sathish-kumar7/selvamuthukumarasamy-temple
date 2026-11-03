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
  /** Optional rows-per-page picker; each choice links back to page 1 at that size. */
  pageSizes?: readonly number[];
  buildSizeHref?: (size: number) => string;
}

export function Pagination({ page, pageCount, total, pageSize, buildHref, pageSizes, buildSizeHref }: Props) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-stone-600" aria-label="Pagination">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p>
          Showing <span className="font-medium text-stone-900">{start}–{end}</span> of{" "}
          <span className="font-medium text-stone-900">{total}</span>
        </p>
        {pageSizes && buildSizeHref ? (
          <div className="flex items-center gap-1.5" role="group" aria-label="Rows per page">
            <span>Per page</span>
            {pageSizes.map((size) => (
              <Link
                key={size}
                href={buildSizeHref(size)}
                aria-current={size === pageSize ? "true" : undefined}
                className={cn(
                  buttonClasses("outline", "sm", "min-w-10 px-2"),
                  size === pageSize && "border-saffron-600 bg-saffron-50 text-saffron-900 hover:bg-saffron-50",
                )}
              >
                {size}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
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
