/** Minimal RFC 4180 CSV serialiser. Values are quoted when needed. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // Prevent spreadsheet formula injection for cells starting with = + - @
    const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  // BOM so Excel opens UTF-8 (₹ and Indian names) correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
