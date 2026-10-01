import type { Metadata } from "next";
import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";
import { Noto_Sans_Tamil } from "next/font/google";
import { LoginForm } from "./login-form";
import { TempleMark } from "@/components/layout/temple-mark";
import { BRANDING } from "@/lib/branding";
import { cn } from "@/lib/cn";

const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["500", "700", "800"], display: "swap" });

export const metadata: Metadata = { title: "Sign in" };

function publicFileExists(publicPath: string): boolean {
  const file = publicPath.replace(/^\//, "").split("?")[0];
  return existsSync(path.join(process.cwd(), "public", file));
}

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;
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
        className="relative flex min-h-[28rem] shrink-0 flex-col items-center justify-end overflow-hidden bg-maroon-950 px-4 pb-8 pt-10 text-center text-white sm:min-h-[32rem] lg:min-h-screen lg:w-1/2 lg:pb-12"
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
        {/* Maroon tint: multiply blend keeps highlights and detail instead of veiling the photo */}
        <div aria-hidden className="absolute inset-0 mix-blend-multiply bg-gradient-to-b from-maroon-100/60 via-maroon-300/90 via-55% to-maroon-900" />
        {/* Extra darkening behind the text only */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent via-maroon-950/60 to-maroon-950/90" />

        <div className="relative z-10 flex flex-col items-center px-6 [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]">
          <div className="hidden size-20 items-center justify-center overflow-hidden rounded-full border-2 border-saffron-300/80 lg:flex bg-maroon-900/80 shadow-[0_0_40px_rgba(249,127,13,0.35)] sm:size-24">
            {logo}
          </div>
          <p className={cn(tamil.className, "mt-4 text-sm font-medium tracking-wide text-saffron-200 sm:text-base")}>{BRANDING.invocationTamil}</p>
          <p className={cn(tamil.className, "mt-2 text-base font-medium text-white/90 sm:text-lg")}>
            <span aria-hidden className="mr-2 text-saffron-300">✦</span>
            {BRANDING.prefixTamil}
            <span aria-hidden className="ml-2 text-saffron-300">✦</span>
          </p>
          <h1 className={cn(tamil.className, "mt-3 font-bold leading-relaxed drop-shadow")}>
            <span className="block text-xl sm:text-2xl lg:text-3xl">{BRANDING.nameLine1Tamil}</span>
            <span className="mt-3 block text-2xl sm:text-3xl lg:text-4xl">{BRANDING.nameLine2Tamil}</span>
          </h1>
          <p className={cn(tamil.className, "mt-4 text-base font-bold text-saffron-200 sm:text-lg lg:text-xl")}>{BRANDING.locationTamil}</p>
        </div>
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
