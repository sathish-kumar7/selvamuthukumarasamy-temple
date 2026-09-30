import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { TempleMark } from "@/components/layout/temple-mark";
import { getTempleSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : undefined;
  const settings = await getTempleSettings();

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-saffron-50 to-stone-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <TempleMark className="size-14 text-saffron-700" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">{settings.templeName}</h1>
          <p className="mt-1 text-sm text-stone-500">Donation Management · Staff sign in</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-stone-400">Authorised temple staff only. All activity is logged.</p>
      </div>
    </main>
  );
}
