import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { getDefaultDashboardPath } from "@/modules/auth/redirects";
import { getCurrentUser } from "@/modules/auth/server-auth";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
          Stack Varsity
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-3">
          {user ? (
            <>
              <Badge variant="secondary">{user.role}</Badge>
              <Link
                href={getDefaultDashboardPath(user.role)}
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
        </nav>
      </div>
    </header>
  );
}
