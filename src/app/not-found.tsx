import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex flex-1 max-w-2xl flex-col items-center justify-center px-4 py-24 text-center"
    >
      <p className="font-mono text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        The page or learning track you requested could not be found. It may have been moved or is
        not yet published.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go to homepage
        </Link>
        <Link
          href="/courses"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Browse courses
        </Link>
        <Link
          href="/certifications"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Certification tracks
        </Link>
      </div>
    </main>
  );
}
