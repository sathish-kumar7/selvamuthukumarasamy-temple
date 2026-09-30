"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ size = "md", variant = "primary" as const }: { size?: "md" | "lg"; variant?: "primary" | "outline" }) {
  return (
    <Button variant={variant} size={size} onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden /> Print receipt
    </Button>
  );
}
