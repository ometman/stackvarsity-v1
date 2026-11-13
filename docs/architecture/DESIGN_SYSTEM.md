# Stack Varsity V1 — Design System

## 1. Approved Branding & Asset Audit

### Business Identity

- **Business**: Stack Varsity
- **Tagline**: Build • Educate • Innovate
- **Canonical Domain**: `https://www.mystackvarsity.com`
- **Contact Email**: `hello@mystackvarsity.com`
- **Focus**: Digital skills education (AI, cloud computing, IT, web development) and professional certification examination preparation.

### Brand Asset Audit

An inspection of `public/` and `src/app/` confirmed:

- **Logos & Brand Graphics**: No official Stack Varsity logo files or custom brand illustrations exist in `public/images/` or `public/icons/` (only default Next.js starter SVGs and `favicon.ico`).
- **Brand Colors**: No official color specification is present in the repository yet.
- **Temporary Placeholders (Requires Approval)**:
  - **Wordmark**: Plain typographic `"Stack Varsity"` text lockup until an official SVG logo is supplied.
  - **Color Palette**: High-contrast neutral grayscale tokens in [src/app/globals.css](../../src/app/globals.css) until official primary/accent brand colors are approved.

---

## 2. Design Tokens

All tokens are defined as CSS custom properties in [src/app/globals.css](../../src/app/globals.css) and mapped to Tailwind CSS v4 via `@theme inline` for seamless compatibility with shadcn/ui.

| Category                | Tokens                                                                                                          | Notes                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Surface & Text**      | `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`              | Light & dark theme pairs            |
| **Brand / Interactive** | `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground` | Temporary neutral palette           |
| **Muted & Status**      | `--muted`, `--muted-foreground`, `--destructive`, `--destructive-foreground`                                    | Accessible contrast ratios          |
| **Borders & Focus**     | `--border`, `--input`, `--ring`                                                                                 | `2px` `:focus-visible` outline      |
| **Typography**          | `--font-sans`, `--font-mono`, `--font-heading`                                                                  | Bound to `Geist` & `Geist_Mono`     |
| **Radii**               | `--radius` (`0.625rem`), `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`                             | Derived from base `--radius`        |
| **Shadows**             | `--shadow-sm`, `--shadow-md`, `--shadow-lg`                                                                     | Subtle elevation for cards/popovers |
| **Spacing**             | Tailwind v4 default `0.25rem` (`4px`) scale                                                                     | Consistent `gap-*`, `p-*`, `m-*`    |

---

## 3. Themes (Light & Dark)

- **Light theme**: Defined on `:root`.
- **Dark theme**: Defined on `.dark` using `@custom-variant dark (&:is(.dark *));`.
- **Hydration safety**: Theme tokens are resolved via CSS variables without reading `window` or `localStorage` during SSR render, preventing hydration mismatches.

---

## 4. Typography

Loaded via `next/font/google` in [src/app/layout.tsx](../../src/app/layout.tsx) (`Geist` as `--font-geist-sans`, `Geist_Mono` as `--font-geist-mono`).

| Role                       | Recommended Classes                                 |
| -------------------------- | --------------------------------------------------- |
| **Page Heading (`h1`)**    | `text-3xl font-semibold tracking-tight sm:text-4xl` |
| **Section Heading (`h2`)** | `text-xl font-semibold tracking-tight sm:text-2xl`  |
| **Body Text**              | `text-base leading-7 text-foreground`               |
| **Captions / Helper Text** | `text-sm text-muted-foreground`                     |
| **Buttons**                | `text-sm font-medium`                               |
| **Form Labels**            | `text-sm font-medium leading-none`                  |

---

## 5. Component & Accessibility Conventions

- **Design Principles**: Clean, modern, mobile-first, responsive, minimal visual clutter, no excessive animations.
- **Semantic HTML**: Use `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, and native `<button>`/`<a>`.
- **Focus & Keyboard**: Global `:focus-visible` indicator in [src/app/globals.css](../../src/app/globals.css); all interactive controls must be keyboard navigable.
- **Reduced Motion**: `prefers-reduced-motion: reduce` disables non-essential transitions and animations globally.
- **Metadata**: Root metadata in [src/app/layout.tsx](../../src/app/layout.tsx) sets `metadataBase`, `title.default`, `title.template`, `description`, `publisher`, and `authors` without unapproved social handles.
