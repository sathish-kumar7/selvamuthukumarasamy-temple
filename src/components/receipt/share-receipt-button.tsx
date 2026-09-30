"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildShareMessage, buildWhatsAppUrl } from "@/lib/share";
import { cn } from "@/lib/cn";

interface Props {
  receiptNumber: string;
  amount: string;
  donationDate: string; // ISO
  donorMobile: string;
  token: string;
  templeName?: string;
  variant?: "icon" | "button";
  size?: "md" | "lg";
  className?: string;
}

export function ShareReceiptButton({
  receiptNumber,
  amount,
  donationDate,
  donorMobile,
  token,
  templeName = "Selva Muthukumarasamy Temple",
  variant = "button",
  size = "md",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function toggle() {
    // Detect Web Share support at interaction time (avoids a hydration-only effect).
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? ""}/receipt/${token}`;
  const message = buildShareMessage({
    receiptNumber,
    amount,
    donationDate: new Date(donationDate),
    donorMobile,
    publicUrl,
    templeName,
  });

  async function copy(text: string, kind: "link" | "message") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard may be unavailable in insecure contexts; fall back to prompt-less no-op.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: `Receipt ${receiptNumber}`, text: message });
      setOpen(false);
    } catch {
      // User cancelled or share failed; keep the menu open for alternatives.
    }
  }

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={toggle}
        className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        title="Share receipt"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 className="size-4" aria-hidden />
        <span className="sr-only">Share receipt</span>
      </button>
    ) : (
      <Button variant="outline" size={size} onClick={toggle} aria-haspopup="menu" aria-expanded={open} className={className}>
        <Share2 className="size-4" aria-hidden /> Share
      </Button>
    );

  return (
    <div className="relative inline-block" ref={menuRef}>
      {trigger}
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-30 mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg",
            variant === "icon" ? "right-0" : "left-0",
          )}
        >
          {canNativeShare ? (
            <MenuItem onClick={nativeShare} icon={<Share2 className="size-4" aria-hidden />}>
              Share via…
            </MenuItem>
          ) : null}
          <a
            role="menuitem"
            href={buildWhatsAppUrl(donorMobile, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-stone-800 hover:bg-stone-100"
          >
            <MessageCircle className="size-4 text-emerald-600" aria-hidden /> Send on WhatsApp
          </a>
          <MenuItem onClick={() => copy(publicUrl, "link")} icon={copied === "link" ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Link2 className="size-4" aria-hidden />}>
            {copied === "link" ? "Link copied" : "Copy receipt link"}
          </MenuItem>
          <MenuItem onClick={() => copy(message, "message")} icon={copied === "message" ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
            {copied === "message" ? "Message copied" : "Copy message"}
          </MenuItem>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm text-stone-800 hover:bg-stone-100"
    >
      <span className="text-stone-500">{icon}</span>
      {children}
    </button>
  );
}
