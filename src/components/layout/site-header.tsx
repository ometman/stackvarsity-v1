import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Badge } from "@/components/ui/badge";
import { primaryNavItems } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { getDefaultDashboardPath } from "@/modules/auth/redirects";
import { getCurrentUser } from "@/modules/auth/server-auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const dashboardPath = user ? getDefaultDashboardPath(user.role) : undefined;

  return (
    <header className="relative border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
            {siteConfig.name}
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-5 md:flex">
            {primaryNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {user && dashboardPath ? (
              <>
                <Badge variant="secondary">{user.role}</Badge>
                <Link
                  href={dashboardPath}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <MobileNav
            items={primaryNavItems}
            isAuthenticated={Boolean(user)}
            dashboardPath={dashboardPath}
          />
        </div>
      </div>
    </header>
  );
}
