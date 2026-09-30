import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold text-saffron-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-900">Page not found</h1>
      <p className="mt-2 text-sm text-stone-500">The page you are looking for does not exist or has moved.</p>
      <Button href="/dashboard" className="mt-6" variant="outline">
        Go to dashboard
      </Button>
    </main>
  );
}
