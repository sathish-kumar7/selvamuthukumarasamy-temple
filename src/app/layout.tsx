import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Tamil face for receipts (labels are printed in Tamil, like the temple's paper receipt book).
const notoTamil = Noto_Sans_Tamil({ variable: "--font-noto-tamil", subsets: ["tamil", "latin"], weight: ["400", "500", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · Donations`, template: `%s · ${APP_NAME}` },
  description: "Donation and receipt management for Selva Muthukumarasamy Temple",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e56303",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${notoTamil.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
