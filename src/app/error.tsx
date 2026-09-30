"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        An unexpected error occurred. Your data has not been lost. Please try again, and contact the administrator if the
        problem continues.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-stone-400">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button href="/dashboard" variant="outline">
          Dashboard
        </Button>
      </div>
    </main>
  );
}
