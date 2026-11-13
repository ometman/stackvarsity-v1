# Stack Varsity V1 — UI Components & Styling Architecture

## Styling Foundation

- **Tailwind CSS**: `4.3.3` with `@tailwindcss/turbopack` (`4.3.3`) configured in [next.config.ts](../../next.config.ts) and [src/app/globals.css](../../src/app/globals.css).
- **Theme Tokens**: CSS custom properties (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`) are defined in [src/app/globals.css](../../src/app/globals.css) and mapped via `@theme inline` for light and `.dark` modes.
- **Typography**: `Geist` (`--font-geist-sans`) and `Geist_Mono` (`--font-geist-mono`) loaded in [src/app/layout.tsx](../../src/app/layout.tsx) and bound to `--font-sans` and `--font-mono`.

---

## shadcn/ui Configuration

Initialized via `npx shadcn@latest init` in [components.json](../../components.json):

- **Style**: `base-nova` (powered by `@base-ui/react`)
- **RSC & TypeScript**: Enabled (`rsc: true`, `tsx: true`)
- **Icon Library**: `lucide-react`
- **Aliases**:
  - `@/components` → `src/components`
  - `@/components/ui` → `src/components/ui`
  - `@/lib/utils` → `src/lib/utils`
  - `@/lib` → `src/lib`
  - `@/hooks` → `src/hooks`

### Shared `cn` Utility

[src/lib/utils.ts](../../src/lib/utils.ts) re-exports `cn` from the `cn` package as the single class-merging utility across the project. Do not create duplicate `cn` helpers elsewhere.

---

## Component Organization

| Directory                | Responsibility                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/components/ui/`     | Low-level shadcn/ui primitives (`button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `separator.tsx`, `badge.tsx`). |
| `src/components/shared/` | Application-wide composite components composed from `ui/` primitives.                                              |
| `src/components/layout/` | Shell components (headers, navigation bars, sidebars, footers).                                                    |

### Installed Primitives

- `Button` (`src/components/ui/button.tsx`)
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (`src/components/ui/card.tsx`)
- `Input` (`src/components/ui/input.tsx`)
- `Label` (`src/components/ui/label.tsx`)
- `Separator` (`src/components/ui/separator.tsx`)
- `Badge` (`src/components/ui/badge.tsx`)

---

## Icon Conventions (`lucide-react`)

- Default inline icon size inside buttons/inputs: `size-4` (16px). Smaller badge icons: `size-3.5`.
- **Decorative icons** alongside visible text must include `aria-hidden="true"`.
- **Icon-only buttons** must provide an accessible name via `aria-label` (or a visually hidden `sr-only` label).

---

## Accessibility Conventions

- **Semantic HTML**: Use `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, and native `<button>`/`<a>` elements rather than clickable `<div>` elements.
- **Keyboard & Focus**: All interactive elements must remain keyboard-reachable (`Tab`, `Enter`, `Space`, `Escape`). Global `:focus-visible` outline styles are enforced in [src/app/globals.css](../../src/app/globals.css).
- **Form Labels**: Every form control must be paired with a `<Label htmlFor="...">` matching the input's `id`.
- **Contrast & Responsive Design**: Use semantic theme tokens (`text-foreground`, `text-muted-foreground`, `bg-background`) and mobile-first responsive utilities (`sm:`, `md:`, `lg:`).
- **Reduced Motion**: `prefers-reduced-motion: reduce` is respected globally in [src/app/globals.css](../../src/app/globals.css).

---

## Development-Only Verification Route

- Route: `/dev/ui` ([src/app/dev/ui/page.tsx](../../src/app/dev/ui/page.tsx))
- Guarded with `if (process.env.NODE_ENV !== "development") notFound();` and `robots: { index: false, follow: false }` so it is only accessible during local development and returns `404` in production builds.
