import { cn } from "@/lib/cn";

/** Simple gopuram-inspired mark used as the logo placeholder. */
export function TempleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-10", className)}>
      <rect width="48" height="48" rx="10" fill="currentColor" opacity="0.12" />
      <path
        d="M24 8l3 6h-6l3-6zm-6 8h12l2 6H16l2-6zm-4 8h20l2 6H12l2-6zm-3 8h26v4H11v-4z"
        fill="currentColor"
      />
    </svg>
  );
}
