import { requireUser } from "@/lib/auth/current-user";
import { getTempleSettings } from "@/lib/settings";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const [user, settings] = await Promise.all([requireUser(), getTempleSettings()]);
  return (
    <AppShell user={{ name: user.name, role: user.role }} templeName={settings.templeName}>
      {children}
    </AppShell>
  );
}
