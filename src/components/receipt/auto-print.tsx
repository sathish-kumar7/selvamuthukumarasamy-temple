"use client";

import { useEffect } from "react";

/** Triggers the print dialog once the page has rendered (used by ?print=1 links). */
export function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
