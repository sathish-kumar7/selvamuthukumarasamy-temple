import { splitAmount } from "@/lib/money";

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(" ");
}

/** Converts a non-negative integer to words using the Indian numbering system. */
export function integerToIndianWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "Zero";

  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(`${integerToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** "1001.50" -> "Rupees One Thousand One and Fifty Paise Only" */
export function amountInWords(value: string): string {
  const { rupees, paise } = splitAmount(value);
  const rupeeWords = integerToIndianWords(rupees);
  let result = rupeeWords ? `Rupees ${rupeeWords}` : "";
  if (paise > 0) {
    result += `${result ? " and " : ""}${integerToIndianWords(paise)} Paise`;
  }
  return `${result || "Rupees Zero"} Only`;
}

/**
 * Words without the "Rupees … Only" wrapper, for the receipt line
 * "அவர்களிடமிருந்து ரூபாய் <words> மட்டும்": "1001.50" -> "One Thousand One and Fifty Paise".
 */
export function amountInWordsBare(value: string): string {
  const { rupees, paise } = splitAmount(value);
  const rupeeWords = integerToIndianWords(rupees);
  const parts: string[] = [];
  if (rupeeWords) parts.push(rupeeWords);
  if (paise > 0) parts.push(`${integerToIndianWords(paise)} Paise`);
  return parts.join(" and ") || "Zero";
}
