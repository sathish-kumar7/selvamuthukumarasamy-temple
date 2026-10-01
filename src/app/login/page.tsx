import type { Metadata } from "next";
import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";
import { Noto_Sans_Tamil } from "next/font/google";
import { LoginForm } from "./login-form";
import { TempleMark } from "@/components/layout/temple-mark";
import { getTempleSettings } from "@/lib/settings";
import { BRANDING } from "@/lib/branding";
import { cn } from "@/lib/cn";

const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["500", "700"], display: "swap" });

export const metadata: Metadata = { title: "Sign in" };

function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;
  const settings = await getTempleSettings();
  const hasHero = publicFileExists(BRANDING.heroImage);
  const hasLogo = publicFileExists(BRANDING.logoImage);

  const logo = hasLogo ? (
    <Image src={BRANDING.logoImage} alt="" width={96} height={96} className="size-full object-cover" priority />
  ) : (
    <TempleMark className="size-14 text-saffron-300" />
  );

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Hero panel */}
      <section
        aria-label="Temple"
        className="relative flex min-h-72 shrink-0 flex-col items-center justify-center overflow-hidden bg-maroon-950 px-4 py-10 text-center text-white sm:min-h-80 lg:min-h-screen lg:w-1/2 lg:py-16"
      >
        {hasHero ? (
          <Image src={BRANDING.heroImage} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-top" />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-saffron-700)_0%,_var(--color-maroon-900)_45%,_var(--color-maroon-950)_100%)]"
          >
            <TempleMark className="absolute left-1/2 top-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 text-white/5" />
          </div>
        )}
        {/* Overlay for legibility */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-maroon-950/55 via-maroon-950/60 to-maroon-950/90" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.12),_transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center px-6">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-saffron-300/80 bg-maroon-900/80 shadow-[0_0_40px_rgba(249,127,13,0.35)] sm:size-24">
            {logo}
          </div>
          <h1 className={cn(tamil.className, "mt-4 text-2xl font-bold leading-snug drop-shadow sm:text-3xl lg:text-4xl")}>
            {BRANDING.templeNameTamil}
          </h1>
          <p className={cn(tamil.className, "mt-1 text-sm font-medium text-saffron-200 sm:text-base lg:text-lg")}>{BRANDING.subtitleTamil}</p>
          <p className="mt-2 text-xs text-white/85 sm:text-sm lg:text-base">
            {settings.templeName} · {BRANDING.tagline}
          </p>
        </div>

        <p className={cn(tamil.className, "absolute inset-x-6 bottom-6 z-10 hidden text-sm text-white/80 lg:block")}>{BRANDING.quoteTamil}</p>
      </section>

      {/* Login panel */}
      <section className="flex flex-1 items-center justify-center bg-stone-50 px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Temple Accounts Login</h2>
            <p className="mt-1 text-sm text-stone-500">Sign in to record donations and issue receipts.</p>
            <div className="mt-6">
              <LoginForm next={next} />
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-stone-400">Authorised temple staff only. All activity is logged.</p>
        </div>
      </section>
    </main>
  );
}
